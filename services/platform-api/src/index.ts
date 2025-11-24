import dotenv from "dotenv";
import { createServer } from "./server.js";

dotenv.config();

const port = process.env.PORT || 3001;
const app = createServer();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
