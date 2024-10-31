import type { AssetWithCategory, AssetCategory, ListResponse } from "./@types/dbTypes";


export const findAssets = async (
    db: D1Database,
    limit: number = 10,
    offset: number = 0
): Promise<ListResponse<AssetWithCategory>> => {
    const query = `
        SELECT asset.id, asset.date, asset.amount, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id        
        ORDER BY asset.date DESC
        LIMIT ? OFFSET ?        
    `;
    const countQuery = `SELECT COUNT(*) as totalCount FROM asset`;

    // Prepare and execute the queries
    const { results } = await db.prepare(query).bind(limit, offset).all<AssetWithCategory>();
    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();

    // Set up ListResponse
    const assets = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    return {
        contents: assets,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
    };
}

export const addAsset = async (
    db: D1Database,
    date: string,
    amount: number,
    asset_category_id: number,
    description?: string
) => {
    const insertQuery = `
        INSERT INTO asset (date, amount, asset_category_id, description)
        VALUES (?, ?, ?, ?)
    `;
    const insertResult = await db.prepare(insertQuery)
        .bind(date, amount, asset_category_id, description ?? null)
        .run();
    if (!insertResult.success) {
        throw new Error("Failed to add asset");
    }
    // 挿入した資産を再度取得する
    const selectQuery = `
        SELECT 
        asset.id, asset.date, asset.amount, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
        WHERE asset.date = ? AND asset.amount = ? AND asset.asset_category_id = ?
        ORDER BY asset.id DESC
        LIMIT 1
        `;
    const asset = await db.prepare(selectQuery).bind(date, amount, asset_category_id).first<AssetWithCategory>();
    return asset ?? null
}

export const findAssetCategories = async (
    db: D1Database,
    limit: number = 10,
    offset: number = 0): Promise<ListResponse<AssetCategory>> => {
    const query = `
        SELECT *
        FROM asset_category
        LIMIT ? OFFSET ?                
    `
    const countQuery = `SELECT COUNT(*) as totalCount FROM asset_category`;
    const { results } = await db.prepare(query).bind(limit, offset).all<AssetCategory>();
    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();

    const asset_categories = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    return {
        contents: asset_categories,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
    };
}