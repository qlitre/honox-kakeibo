import {} from "hono";

declare module "hono" {
  interface Env {
    Variables: {};
    Bindings: {
      HONO_IS_COOL: string;
      DB: D1Database;
      FB_API_KEY: string;
      FB_AUTH_DOMAIN: string;
      FB_PROJECT_ID: string;
      FB_STORAGE_BUCKET: string;
      FB_MESSAGE_SENDER_ID: string;
      FB_APP_ID: string;
      SLACK_WEBHOOK_URL: string;
    };
  }
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { title?: string },
    ): Response | Promise<Response>;
  }
}
