import { createServer } from "node:http";

import { createApp } from "./src/app.js";

const port = Number(process.env.PORT || 3000);
const app = createApp();

const server = createServer((request, response) => {
  app.handle(request, response).catch((error) => {
    console.error(error);
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
  });
});

server.listen(port, () => {
  console.log(`Field agreement assistant listening on http://localhost:${port}`);
});
