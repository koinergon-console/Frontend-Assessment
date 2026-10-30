const dotenv = require('dotenv').config();
const http = require("http");
const cluster = require("cluster");
const os = require("os");
const app = require("./app");
const config = require("./config/config");

// DB import
require("./config/mongoose").connect();

const basePortRaw = process.env.PORT ?? config.server.port ?? 5000;
const basePort = Number.parseInt(String(basePortRaw), 10);
const initialPort = Number.isFinite(basePort) ? basePort : 5000;

const isProd = config.server.nodeEnv === "PROD";

// ✅ DEV: simple single-process server (no cluster involvement)
if (!isProd) {
  const startDevServer = (portToTry, attemptsLeft) => {
    const server = http.createServer(app);

    server.listen(portToTry, () => {
      const addr = server.address();
      const host = addr?.address === "::" ? "localhost" : addr?.address;

      console.log(
        `\n=============== 🚀🚀🚀 Server running on port ${portToTry} 🚀🚀🚀 ===============`,
      );
      console.log(
        `=============== 🚀🚀🚀 Current time: ${new Date().toString()} 🚀🚀🚀 ===============`,
      );
      console.log(`=============== Base PORT requested: ${initialPort} ===============`);
      console.log(`=============== URL: http://${host}:${addr.port} ===============\n`);
    });

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE" && attemptsLeft > 0) {
        const nextPort = portToTry + 1;
        console.error(
          `Port ${portToTry} already in use. Retrying on ${nextPort}...`,
        );
        server.close(() => startDevServer(nextPort, attemptsLeft - 1));
        return;
      }

      console.error(`Handling server error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  };

  startDevServer(initialPort, 10);

  return; // important: stop here
}

// ✅ PROD: cluster mode
if (cluster.isMaster) {
  const port = initialPort;
  const numWorkers = os.cpus().length;
  console.log(`Master ${process.pid} starting ${numWorkers} workers...`);

  let hasLoggedListening = false;

  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();

    worker.on("message", (message) => {
      if (!hasLoggedListening && message?.type === "LISTENING") {
        hasLoggedListening = true;

        const addr = message.address;
        const host = addr?.address === "::" ? "localhost" : addr?.address;

        console.log(
          `Server running on port ${port}.  http://${host}:${addr.port} at  on ${config.server.nodeEnv} environment (master PID ${process.pid})`,
        );
      }
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} died (code ${code}, signal ${signal}). Restarting...`,
    );
    cluster.fork();
  });
} else {
  const port = initialPort;
  const server = http.createServer(app);

  server.listen(port, () => {
    if (process.send) {
      process.send({ type: "LISTENING", address: server.address() });
    }
  });

  server.on("error", (err) => {
    console.error(`Handling server error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}
