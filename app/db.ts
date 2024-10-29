import type { AssetWithCategory, ListResponse } from "./@types/dbTypes";


export const findAssets = async (
    db: D1Database,
    limit: number = 10,
    offset: number = 0
): Promise<ListResponse<AssetWithCategory>> => {
    const query = `
        SELECT asset.id, asset.date, asset.amount, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
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