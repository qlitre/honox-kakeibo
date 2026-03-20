import { z } from "zod";

// クエリパラメータ: 一覧取得
export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  filters: z.string().optional(),
  orders: z.string().optional(),
});

// クエリパラメータ: サマリー
export const SummaryQuery = z.object({
  filters: z.string().optional(),
  groupby: z.string().optional(),
});

// パスパラメータ: ID
export const IdParam = z.object({
  id: z.coerce.number().int().min(1),
});

// エラーレスポンス
export const ErrorResponse = z.object({
  error: z.string(),
});

// 削除成功レスポンス
export const DeleteSuccessResponse = z.object({
  message: z.string(),
});

// 一覧レスポンスのラッパー
export function createListResponseSchema(itemSchema: z.ZodType<any>) {
  return z.object({
    contents: z.array(itemSchema),
    totalCount: z.number(),
    limit: z.number(),
    offset: z.number(),
    pageSize: z.number(),
  });
}

// サマリーレスポンスのラッパー
export function createSummaryResponseSchema(itemSchema: z.ZodType<any>) {
  return z.object({
    summary: z.array(itemSchema),
  });
}
