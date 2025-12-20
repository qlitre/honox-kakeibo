import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />
        {title ? <title>{title}</title> : ""}
      </head>
      <body>{children}</body>
    </html>
  );
});
