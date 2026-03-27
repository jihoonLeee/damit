import { createServer } from "node:http";

import { createApp } from "./src/app.js";
import { captureServerError, flushObservability, initializeObservability } from "./src/observability/sentry.js";

const port = Number(process.env.PORT || 3000);

await initializeObservability();

const app = createApp();

const server = createServer((request, response) => {
  app.handle(request, response).catch(async (error) => {
    console.error(error);
    captureServerError(error, {
      channel: "server-uncaught",
      requestId: "req_uncaught",
      status: 500,
      code: "INTERNAL_ERROR",
      request
    });
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "잠시 후 다시 시도해주세요",
          requestId: "req_uncaught"
        }
      })
    );
    await flushObservability(1000);
  });
});

server.listen(port, () => {
  console.log(`Field agreement assistant listening on http://localhost:${port}`);
});
