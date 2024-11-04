export const buildSqlWhereClause = (tableName: string, filterString: string) => {
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


export const buildSqlOrderByClause = (tableName: string, orderParams: string) => {
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