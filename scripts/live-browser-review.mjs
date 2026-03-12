
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const outputPath = path.join(workspaceRoot, "output", "visual-review", "live-browser-review.json");

const debugPort = Number(process.env.EDGE_DEBUG_PORT || 9223);
const baseUrl = process.env.REVIEW_BASE_URL || "http://127.0.0.1:3002";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await response.json();
    const target = targets.find((item) => typeof item.url === "string" && item.url.startsWith(baseUrl));
    if (target?.webSocketDebuggerUrl) {
      return target;
    }
    await sleep(500);
  }
  throw new Error(`CDP target not found on port ${debugPort}`);
}

function createClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  let messageId = 0;

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (!payload.id) {
      return;
    }
    const handlers = pending.get(payload.id);
    if (!handlers) {
      return;
    }
    pending.delete(payload.id);
    if (payload.error) {
      handlers.reject(new Error(payload.error.message));
      return;
    }
    handlers.resolve(payload.result);
  });

  return {
    ready,
    async send(method, params = {}) {
      await ready;
      const id = ++messageId;
      const message = JSON.stringify({ id, method, params });
      return await new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(message);
      });
    },
    close() {
      socket.close();
    }
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return result.result?.value;
}

async function main() {
  const target = await getTarget();
  const client = createClient(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const report = {
    baseUrl,
    debugPort,
    quickJump: null,
    copy: null,
    checkedAt: new Date().toISOString()
  };

  try {
    await client.send("Page.navigate", { url: `${baseUrl}/?review=detail` });
    await sleep(1500);

    const quickJumpMetrics = await evaluate(
      client,
      `(() => {
        const chips = Array.from(document.querySelectorAll('#detail-jump [data-target]'));
        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          chips: chips.map((chip) => {
            const rect = chip.getBoundingClientRect();
            return {
              label: chip.textContent.trim(),
              targetId: chip.dataset.target,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              x: Math.round(rect.left),
              y: Math.round(rect.top)
            };
          })
        };
      })()`
    );

    const jumpResults = [];
    for (const chip of quickJumpMetrics.chips) {
      await evaluate(
        client,
        `(() => {
          const chip = document.querySelector('#detail-jump [data-target="${chip.targetId}"]');
          chip?.click();
          return true;
        })()`
      );
      await sleep(350);
      const after = await evaluate(
        client,
        `(() => {
          const target = document.getElementById('${chip.targetId}');
          const rect = target?.getBoundingClientRect();
          return {
            targetTop: rect ? Math.round(rect.top) : null,
            targetBottom: rect ? Math.round(rect.bottom) : null,
            scrollY: Math.round(window.scrollY)
          };
        })()`
      );
      jumpResults.push({
        ...chip,
        minTapTargetPass: chip.width >= 44 && chip.height >= 44,
        scrollPass: after.targetTop != null && after.targetTop >= -8 && after.targetTop <= 120,
        ...after
      });
    }

    report.quickJump = {
      viewportWidth: quickJumpMetrics.viewportWidth,
      viewportHeight: quickJumpMetrics.viewportHeight,
      chips: jumpResults
    };

    await client.send("Page.navigate", { url: `${baseUrl}/?review=copy` });
    await sleep(1500);
    const copyResult = await evaluate(
      client,
      `(() => {
        const button = document.querySelector('#copy-draft');
        button?.click();
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              draftBody: document.querySelector('#draft-body')?.innerText?.trim() || '',
              hintText: document.querySelector('#copy-hint')?.innerText?.trim() || '',
              feedbackText: document.querySelector('#detail-feedback')?.innerText?.trim() || ''
            });
          }, 500);
        });
      })()`
    );

    report.copy = copyResult;

    await client.send("Page.navigate", { url: `${baseUrl}/?review=detail` });
    await sleep(800);
  } finally {
    client.close();
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
