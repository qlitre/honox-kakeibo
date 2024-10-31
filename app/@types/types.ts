export type KakeiboQueries = {
    limit?: number;
    offset?: number;
    orders?: string;
    fields?: string | string[];
    filters?: string;
}

export type GetListRequest = {
    endpoint: string;
    queries?: KakeiboQueries;
}