import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { TableName } from "@/utils/sqlUtils";
import {
  fetchListWithFilter,
  fetchDetail,
  createItem,
  updateItem,
  deleteItem,
  fetchSummary,
} from "@/libs/dbService";
import {
  PaginationQuery,
  SummaryQuery,
  IdParam,
  ErrorResponse,
  DeleteSuccessResponse,
  createListResponseSchema,
  createSummaryResponseSchema,
} from "@/api/schemas/common";

/**
 * z.ZodType<any> を使う理由:
 * - z.ZodType (= z.ZodType<unknown>) だと出力型が unknown になり、
 *   dbService が返す unknown 型との互換でハンドラ全体に as any が必要になる。
 * - z.ZodType<any> にすることで unknown → any の代入が成立し、
 *   ハンドラ内の as any を全て除去できる。
 * - ランタイムの Zod バリデーションは正常に機能するため安全性は維持される。
 */
type CrudRoutesOptions = {
  tableName: TableName;
  tag: string;
  entitySchema: z.ZodType<any>;
  createSchema: z.ZodType<any>;
  updateSchema: z.ZodType<any>;
  summarySchema?: z.ZodType<any>;
};

export function createCrudRoutes(options: CrudRoutesOptions) {
  const {
    tableName,
    tag,
    entitySchema,
    createSchema,
    updateSchema,
    summarySchema,
  } = options;

  const app = new OpenAPIHono();

  const listResponseSchema = createListResponseSchema(entitySchema);

  // GET / - 一覧取得
  const listRoute = createRoute({
    method: "get",
    path: "/",
    tags: [tag],
    summary: `${tag} 一覧取得`,
    request: {
      query: PaginationQuery,
    },
    responses: {
      200: {
        description: `${tag} の一覧`,
        content: { "application/json": { schema: listResponseSchema } },
      },
      500: {
        description: "サーバーエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
    },
  });

  app.openapi(listRoute, async (c) => {
    const { limit, offset, filters, orders } = c.req.valid("query");
    try {
      const result = await fetchListWithFilter({
        db: c.env.DB,
        table: tableName,
        filters,
        orders,
        limit,
        offset,
      });
      return c.json(result, 200);
    } catch (error) {
      console.error(`Error fetching ${tableName} list`, error);
      return c.json({ error: "Failed to fetch data" }, 500);
    }
  });

  // GET /summary - 集計
  if (summarySchema) {
    const summaryResponseSchema = createSummaryResponseSchema(summarySchema);

    const summaryRoute = createRoute({
      method: "get",
      path: "/summary",
      tags: [tag],
      summary: `${tag} 集計`,
      request: {
        query: SummaryQuery,
      },
      responses: {
        200: {
          description: `${tag} の集計結果`,
          content: { "application/json": { schema: summaryResponseSchema } },
        },
        500: {
          description: "サーバーエラー",
          content: { "application/json": { schema: ErrorResponse } },
        },
      },
    });

    // @ts-expect-error: summaryResponseSchemaの全プロパティがz.ZodType<any>由来のため
    // OpenAPIの型解決がneverに崩壊する (具象プロパティが混在するlistResponseSchemaでは発生しない)
    app.openapi(summaryRoute, async (c) => {
      const { filters, groupby } = c.req.valid("query");
      try {
        const result = await fetchSummary({
          db: c.env.DB,
          table: tableName,
          filters,
          groupBy: groupby,
        });
        return c.json(result, 200);
      } catch (error) {
        console.error(`Error fetching ${tableName} summary`, error);
        return c.json({ error: "Failed to fetch summary" }, 500);
      }
    });
  }

  // POST / - 新規作成
  const createRoute_ = createRoute({
    method: "post",
    path: "/",
    tags: [tag],
    summary: `${tag} 新規作成`,
    request: {
      body: {
        content: { "application/json": { schema: createSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        description: `作成された ${tag}`,
        content: { "application/json": { schema: entitySchema } },
      },
      400: {
        description: "バリデーションエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
      500: {
        description: "サーバーエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
    },
  });

  app.openapi(createRoute_, async (c) => {
    const data = c.req.valid("json");
    try {
      const created = await createItem({
        db: c.env.DB,
        table: tableName,
        data: data as Record<string, unknown>,
      });
      return c.json(created, 201);
    } catch (error) {
      console.error(`Error creating ${tableName}`, error);
      return c.json({ error: `Failed to create ${tableName}` }, 500);
    }
  });

  // GET /{id} - 詳細取得
  const detailRoute = createRoute({
    method: "get",
    path: "/{id}",
    tags: [tag],
    summary: `${tag} 詳細取得`,
    request: {
      params: IdParam,
    },
    responses: {
      200: {
        description: `${tag} の詳細`,
        content: { "application/json": { schema: entitySchema } },
      },
      404: {
        description: "Not Found",
        content: { "application/json": { schema: ErrorResponse } },
      },
    },
  });

  app.openapi(detailRoute, async (c) => {
    const { id } = c.req.valid("param");
    const detail = await fetchDetail({
      db: c.env.DB,
      table: tableName,
      id,
    });
    if (!detail) {
      return c.json({ error: `${tableName} not found` }, 404);
    }
    return c.json(detail, 200);
  });

  // PUT /{id} - 更新
  const updateRoute = createRoute({
    method: "put",
    path: "/{id}",
    tags: [tag],
    summary: `${tag} 更新`,
    request: {
      params: IdParam,
      body: {
        content: { "application/json": { schema: updateSchema } },
        required: true,
      },
    },
    responses: {
      200: {
        description: `更新された ${tag}`,
        content: { "application/json": { schema: entitySchema } },
      },
      400: {
        description: "バリデーションエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
      404: {
        description: "Not Found",
        content: { "application/json": { schema: ErrorResponse } },
      },
      500: {
        description: "サーバーエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
    },
  });

  app.openapi(updateRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    try {
      const updated = await updateItem({
        db: c.env.DB,
        table: tableName,
        id,
        data: data as Record<string, unknown>,
      });
      return c.json(updated, 200);
    } catch (error) {
      console.error(`Error updating ${tableName}`, error);
      return c.json({ error: `Failed to update ${tableName}` }, 500);
    }
  });

  // DELETE /{id} - 削除
  const deleteRoute = createRoute({
    method: "delete",
    path: "/{id}",
    tags: [tag],
    summary: `${tag} 削除`,
    request: {
      params: IdParam,
    },
    responses: {
      200: {
        description: "削除成功",
        content: { "application/json": { schema: DeleteSuccessResponse } },
      },
      409: {
        description: "参照制約エラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
      500: {
        description: "サーバーエラー",
        content: { "application/json": { schema: ErrorResponse } },
      },
    },
  });

  app.openapi(deleteRoute, async (c) => {
    const { id } = c.req.valid("param");
    try {
      await deleteItem({
        db: c.env.DB,
        table: tableName,
        id,
      });
      return c.json({ message: `${tableName} deleted successfully` }, 200);
    } catch (error: any) {
      console.error(`Error deleting ${tableName}`, error);
      if (error.message?.includes("SQLITE_CONSTRAINT")) {
        return c.json(
          { error: "このカテゴリは利用されているため削除できません。" },
          409,
        );
      }
      return c.json({ error: `Failed to delete ${tableName}` }, 500);
    }
  });

  return app;
}
