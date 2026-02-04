import index from "./index.html";
import Elysia from "elysia";
import { fileManagerEndpoint } from "./controllers/File/File";
import { terminalEndpoint } from "./controllers/Terminal/Terminal";
import swagger from "@elysiajs/swagger";

const app = new Elysia();

app.use(swagger());
app.use(fileManagerEndpoint);
app.use(terminalEndpoint);
app.get("/", index);

app.listen(3000, (sv) => {
  console.log(`Server started on port ${sv.port}!`);
});
