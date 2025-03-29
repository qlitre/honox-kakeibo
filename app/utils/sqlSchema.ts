type Join = {
  table: string;
  condition: string;
};

type SchemaEntry = {
  fields: string[];
  joinFields: string[];
  tableName: string;
  joins: Join[];
  requiredFields: string[];
  optionalFields: string[];
};

// スキーマ全体の型
type Schema = {
  [key: string]: SchemaEntry;
};

export const schema: Schema = {
  asset: {
    fields: [
      "id",
      "date",
      "amount",
      "asset_category_id",
      "description",
      "created_at",
      "updated_at",
    ],
    joinFields: [
      "asset_category.name AS category_name",
      "asset_category.is_investment AS is_investment",
    ],
    tableName: "asset",
    joins: [
      {
        table: "asset_category",
        condition: "asset.asset_category_id = asset_category.id",
      },
    ],
    requiredFields: ["date", "amount", "asset_category_id"],
    optionalFields: ["description"],
  },
  asset_category: {
    fields: ["id", "name", "is_investment", "created_at", "updated_at"],
    joinFields: [],
    tableName: "asset_category",
    joins: [],
    requiredFields: ["name"],
    optionalFields: ["is_investment"],
  },
  fund_transaction: {
    fields: ["id", "date", "amount", "description", "created_at", "updated_at"],
    joinFields: [],
    tableName: "fund_transaction",
    joins: [],
    requiredFields: ["date", "amount"],
    optionalFields: ["description"],
  },
  expense: {
    fields: [
      "id",
      "date",
      "amount",
      "expense_category_id",
      "payment_method_id",
      "description",
      "created_at",
      "updated_at",
    ],
    joinFields: [
      "expense_category.name AS category_name",
      "payment_method.name AS payment_method_name",
    ],
    tableName: "expense",
    joins: [
      {
        table: "expense_category",
        condition: "expense.expense_category_id = expense_category.id",
      },
      {
        table: "payment_method",
        condition: "expense.payment_method_id = payment_method.id",
      },
    ],
    requiredFields: [
      "date",
      "amount",
      "expense_category_id",
      "payment_method_id",
    ],
    optionalFields: ["description"],
  },
  expense_category: {
    fields: ["id", "name", "created_at", "updated_at"],
    joinFields: [],
    tableName: "expense_category",
    joins: [],
    requiredFields: ["name"],
    optionalFields: [],
  },
  payment_method: {
    fields: ["id", "name", "created_at", "updated_at"],
    joinFields: [],
    tableName: "payment_method",
    joins: [],
    requiredFields: ["name"],
    optionalFields: [],
  },
  income: {
    fields: [
      "id",
      "date",
      "amount",
      "income_category_id",
      "description",
      "created_at",
      "updated_at",
    ],
    joinFields: ["income_category.name AS category_name"],
    tableName: "income",
    joins: [
      {
        table: "income_category",
        condition: "income.income_category_id = income_category.id",
      },
    ],
    requiredFields: ["date", "amount", "income_category_id"],
    optionalFields: ["description"],
  },
  income_category: {
    fields: ["id", "name", "created_at", "updated_at"],
    joinFields: [],
    tableName: "income_category",
    joins: [],
    requiredFields: ["name"],
    optionalFields: [],
  },
};
