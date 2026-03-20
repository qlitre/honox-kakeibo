import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import api from "./api";

const app = createApp();

app.route("/api", api);

showRoutes(app);

export default app;
