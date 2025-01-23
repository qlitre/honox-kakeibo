import { schema } from '@/utils/sqlSchema'

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
    updateFields.push('updated_at')
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');

    const query = `
      UPDATE ${tableConfig.tableName}
      SET ${setClause}
      WHERE id = ?;
    `;

    return query.trim();
}

export const generateSummaryQuery = (tableName: TableName): string => {
    const schemaDefinition = schema[tableName];

    if (!schemaDefinition) {
        throw new Error(`Table ${tableName} is not defined in the schema`);
    }

    // 年月別にグループ化するためにstrftime関数を使用
    const dateField = `${tableName}.date`;
    const yearMonth = `strftime('%Y-%m', ${dateField}) AS year_month`;
    const arr = ['SUM(amount) AS total_amount', yearMonth]
    if (schemaDefinition.fields.indexOf(`${tableName}_category_id`) >= 0) {
        const categoryId = `${tableName}_category_id AS category_id`
        arr.push(categoryId)
    }
    arr.push(...schemaDefinition.joinFields)
    // フィールドとJOINフィールドの取得
    const fields = arr.join(', ');
    // JOIN句の組み立て
    const joins = schemaDefinition.joins
        .map(join => `LEFT JOIN ${join.table} ON ${join.condition}`)
        .join(' ');


    // SELECTクエリの組み立て
    const query = `
        SELECT ${fields}
        FROM ${schemaDefinition.tableName}       
        ${joins}
    `
    return query;
};


function isNumeric(value: unknown): boolean {
    return !isNaN(Number(value));
}

export const buildSqlWhereClause = (tableName: TableName, filterString: string) => {
    const conditions: string[] = []; // SQL 条件句を格納する配列
    const operators: Record<string, string> = {
        '[greater_than]': '>',
        '[less_than]': '<',
        '[greater_equal]': '>=',
        '[less_equal]': '<=',
        '[eq]': '='
    };
    const baseFields = schema[tableName].fields
    if (filterString) {
        // date[greater_equal]2024-11-01[and]date[less_equal]2024-11-30
        // のようなフィルター文字列を動的に解析する
        for (const condition of filterString.split('[and]')) {
            for (const operatorKey in operators) {
                if (condition.includes(operatorKey)) {
                    const [fieldName, value] = condition.split(operatorKey);
                    // もっといいやり方がありそうだが、テーブルが持っているフィールドの場合はtablenameをprefixにつける。
                    // そうでなければ受け取った値をそのまま条件にする。join先のフィールドが指定された場合を想定。
                    let field = fieldName
                    if (baseFields.includes(fieldName)) {
                        field = tableName + '.' + field;
                    }
                    const operator = operators[operatorKey];
                    let conditionString
                    if (isNumeric(value)) {
                        conditionString = `${field} ${operator} ${value}`;
                    } else {
                        conditionString = `${field} ${operator} '${value}'`;
                    }
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

