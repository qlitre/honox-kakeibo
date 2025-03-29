import type { NotFoundHandler } from "hono";

const handler: NotFoundHandler = (c) => {
  c.status(404);
  return c.render(<p>not found</p>);
};

export default handler;
