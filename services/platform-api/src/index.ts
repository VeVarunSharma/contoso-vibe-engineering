import dotenv from "dotenv";
import { logger } from "./logger.js";
import { createServer } from "./server.js";

dotenv.config();

const port = process.env.PORT || 3001;
const app = createServer();

app.listen(port, () => {
  logger.info({ port }, "Server running");
});
