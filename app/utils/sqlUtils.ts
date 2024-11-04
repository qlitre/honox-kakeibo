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
    expense: {
        fields: [
            'id', 'date', 'amount', 'expense_category_id', 'payment_method_id',
            'description', 'created_at', 'updated_at'
        ],
        joinFields: [
            'expense_category.name AS category_name',
            'payment_method.method_name AS payment_method_name'
        ],
        tableName: 'expense',
        joins: [
            {
                table: 'expense_category',
                condition: 'expense.expense_category_id = expense_category.id'
            },
            {
                table: 'payment_method',
                condition: 'expense.payment_method_id = payment_method.id'
            }
        ],
        requiredFields: ['date', 'amount', 'expense_category_id', 'payment_method_id'],
        optionalFields: ['description']
    },
    asset: {
        fields: ['id', 'date', 'amount', 'asset_category_id', 'description', 'created_at', 'updated_at'],
        joinFields: ['asset_category.name AS category_name'],
        tableName: 'asset',
        joins: [
            {
                table: 'asset_category',
                condition: 'asset.asset_category_id = asset_category.id'
            }
        ],
        requiredFields: ['date', 'amount', 'asset_category_id'],
        optionalFields: ['description']
    },
    asset_category: {
        fields: ['id', 'name', 'created_at', 'updated_at'],
        joinFields: [],
        tableName: 'asset_category',
        joins: [],
        requiredFields: ['name'],
        optionalFields: []
    },
    expense_category: {
        fields: ['id', 'name', 'created_at', 'updated_at'],
        joinFields: [],
        tableName: 'expense_category',
        joins: [],
        requiredFields: ['name'],
        optionalFields: []
    },
    payment_method: {
        fields: ['id', 'method_name', 'created_at', 'updated_at'],
        joinFields: [],
        tableName: 'payment_method',
        joins: [],
        requiredFields: ['method_name'],
        optionalFields: []
    }
};

export type TableName = keyof typeof schema;

export const generateSelectQuery = (tableName: TableName) => {
    const tableConfig = schema[tableName];
    // フィールドを作成
    let fields = tableConfig.fields.map(field => `${tableName}.${field}`).join(', ');
    const joinFields = tableConfig.joinFields.join(', ');
    if (joinFields) fields += `, ${joinFields}`

    let query = `SELECT ${fields} FROM ${tableName}`;
    if (tableConfig.joins && tableConfig.joins.length > 0) {
        tableConfig.joins.forEach(join => {
            query += ` JOIN ${join.table} ON ${join.condition}`;
        });
    }
    return query
}


// フォームデータの動的な受け取りとバリデーション関数
export const getAndValidateFormData = async (formData: Record<any, any>, tableName: TableName) => {
    const { requiredFields, optionalFields } = schema[tableName];

    // 必須フィールドのバリデーション
    for (const field of requiredFields) {
        if (!formData[field]) {
            return { error: `${field} is required`, isValid: false };
        }
    }

    // 必須とオプションのフィールドを結合して抽出
    const extractedData: Record<string, any> = {};
    [...requiredFields, ...optionalFields].forEach((field) => {
        extractedData[field] = formData[field] ?? null;
    });

    return { data: extractedData, isValid: true };
}


// 動的にINSERTクエリを生成
export const generateInsertQuery = async (tableName: TableName) => {
    const fields = []
    for (const field of schema[tableName].requiredFields) {
        fields.push(field)
    }
    for (const field of schema[tableName].optionalFields) {
        fields.push(field)
    }
    const placeholders = fields.map(() => '?').join(', ');
    const insertQuery = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    return insertQuery
}

export const generateQueryBindValues = async (tableName: TableName, data: Record<string, any>) => {
    const fields = [...schema[tableName].requiredFields, ...schema[tableName].optionalFields].flat();
    const values = fields.map(field => data[field]);
    return values;
}

export const generateUpdateQuery = async (tableName: TableName) => {
    const tableConfig = schema[tableName];

    const updateFields = []
    for (const field of tableConfig.requiredFields) {
        updateFields.push(field)
    }
    for (const field of tableConfig.optionalFields) {
        updateFields.push(field)
    }
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');

    const query = `
      UPDATE ${tableConfig.tableName}
      SET ${setClause}
      WHERE id = ?;
    `;

    return query.trim();
}


export const buildSqlWhereClause = (tableName: TableName, filterString: string) => {
    const conditions: string[] = []; // SQL 条件句を格納する配列
    const operators: Record<string, string> = {
        '[greater_than]': '>',
        '[less_than]': '<',
        '[greater_equal]': '>=',
        '[less_equal]': '<='
    };

    if (filterString) {
        // date[greater_equal]2024-11-01[and]date[less_equal]2024-11-30
        // のようなフィルター文字列を動的に解析する
        for (const condition of filterString.split('[and]')) {
            for (const operatorKey in operators) {
                if (condition.includes(operatorKey)) {
                    const [fieldName, value] = condition.split(operatorKey);
                    const field = tableName + '.' + fieldName;
                    const operator = operators[operatorKey];
                    const conditionString = `${field} ${operator} '${value}'`;
                    conditions.push(conditionString);
                }
            }
        }
    }

    const whereClause = conditions.join(' AND ');
    return `WHERE ${whereClause}`;
}


export const buildSqlOrderByClause = (tableName: TableName, orderParams: string) => {
    const fieldsArray = orderParams.split(',')
    const orderClauses = []

    for (const field of fieldsArray) {
        let sortOrder = ''
        let columnName = ''

        if (field[0] === '-') {
            sortOrder = 'DESC'
            columnName = tableName + '.' + field.slice(1)
        } else {
            sortOrder = 'ASC'
            columnName = tableName + '.' + field
        }
        orderClauses.push(`${columnName} ${sortOrder}`)
    }
    return `ORDER BY ${orderClauses.join(', ')}`
}