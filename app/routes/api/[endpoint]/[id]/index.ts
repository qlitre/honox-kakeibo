import { createRoute } from "honox/factory";
import {
  generateSelectQuery,
  generateUpdateQuery,
  getAndValidateFormData,
  generateQueryBindValues,
} from "@/utils/sqlUtils";
import type { TableName } from "@/utils/sqlUtils";
import { schema } from "@/utils/sqlSchema";

export default createRoute(async (c) => {
  const tableName = c.req.param("endpoint") as TableName;
  if (!(tableName in schema)) {
    return c.json({ error: "Invalid endpoint" }, 400);
  }
  const id = c.req.param("id");
  let selectQuery = generateSelectQuery(tableName);
  selectQuery += ` WHERE ${tableName}.id = ?`;
  const db = c.env.DB;
  const { results } = await db.prepare(selectQuery).bind(id).all();

  if (results.length === 0) {
    return c.json({ error: `${tableName} not found` }, 404);
  }

  return c.json(results[0], 200);
});

export const PUT = createRoute(async (c) => {
  const tableName = c.req.param("endpoint") as TableName;
  if (!(tableName in schema)) {
    return c.json({ error: "Invalid endpoint" }, 400);
  }
  const db = c.env.DB;
  const formData = await c.req.json();
  const { data, isValid, error } = await getAndValidateFormData(
    formData,
    tableName,
  );
  const id = c.req.param("id");
  // バリデーションチェック
  if (!isValid) {
    return c.json({ error }, 400);
  }
  try {
    const updateQuery = await generateUpdateQuery(tableName);
    if (!data) return;
    const values = await generateQueryBindValues(tableName, data);
    const currentDateTime = new Date()
      .toISOString()
      .replace("T", " ")
      .split(".")[0];
    values.push(currentDateTime);
    values.push(id);
    const updateResult = await db
      .prepare(updateQuery)
      .bind(...values)
      .run();
    if (!updateResult.success) {
      throw new Error("Failed to update asset");
    }
    let selectQuery = generateSelectQuery(tableName);
    selectQuery += ` WHERE ${tableName}.id = ?`;
    const { results } = await db.prepare(selectQuery).bind(id).all();
    if (results.length === 0) {
      return c.json({ error: "Asset not found" }, 404);
    }
    return c.json(results[0], 201);
  } catch (error) {
    console.error(`Error update ${tableName}`, error);
    return c.json({ error: `Failed to update ${tableName}` }, 500);
  }
});

export const DELETE = createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const tabaleName = c.req.param("endpoint");
  try {
    const deleteQuery = `
        DELETE FROM ${tabaleName}
        WHERE ID = ?;
    `;
    const deleteResult = await db
      .prepare(deleteQuery)
      .bind(id ?? null)
      .run();
    if (!deleteResult.success) {
      throw new Error(`Failed to delete ${tabaleName}`);
    }
    return c.json({ message: `${tabaleName} deleted successfully` }, 200);
  } catch (error: any) {
    console.error(`Error delete ${tabaleName}`, error);
    if (error.message.includes("SQLITE_CONSTRAINT")) {
      return c.json(
        { error: "このカテゴリは利用されているため削除できません。" },
        409,
      );
    }
    console.error(`Error delete ${tabaleName}`, error);
    return c.json({ error: `Failed to delete ${tabaleName}` }, 500);
  }
});
