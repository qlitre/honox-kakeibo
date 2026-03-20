import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { bearerAuth } from "hono/bearer-auth";
import { expenseRoutes } from "@/api/routes/expense";
import { expenseCategoryRoutes } from "@/api/routes/expense_category";
import { paymentMethodRoutes } from "@/api/routes/payment_method";
import { incomeRoutes } from "@/api/routes/income";
import { incomeCategoryRoutes } from "@/api/routes/income_category";
import { assetRoutes } from "@/api/routes/asset";
import { assetCategoryRoutes } from "@/api/routes/asset_category";
import { fundTransactionRoutes } from "@/api/routes/fund_transaction";
import { expenseCheckTemplateRoutes } from "@/api/routes/expense_check_template";

const api = new OpenAPIHono();

// Bearer認証ミドルウェア
api.use("/*", async (c, next) => {
  // Swagger UI と OpenAPI ドキュメントは認証不要
  if (c.req.path === "/api/ui" || c.req.path === "/api/doc") {
    return next();
  }
  const token = c.env.HONO_IS_COOL;
  const auth = bearerAuth({ token });
  return auth(c, next);
});

// 9テーブルのルートをマウント
api.route("/expense", expenseRoutes);
api.route("/expense_category", expenseCategoryRoutes);
api.route("/payment_method", paymentMethodRoutes);
api.route("/income", incomeRoutes);
api.route("/income_category", incomeCategoryRoutes);
api.route("/asset", assetRoutes);
api.route("/asset_category", assetCategoryRoutes);
api.route("/fund_transaction", fundTransactionRoutes);
api.route("/expense_check_template", expenseCheckTemplateRoutes);

// OpenAPIドキュメント
api.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "Kakeibo API",
    version: "1.0.0",
    description: "家計簿アプリケーションのAPI",
  },
});

// Swagger UI
api.get("/ui", swaggerUI({ url: "/api/doc" }));

export default api;
