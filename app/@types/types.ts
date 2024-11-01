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

export type AddRequest = {
    endpoint: string;
    data: Record<string, any>;
}

export type GetDetailRequest = {
    endpoint: string;
    contentId: string;
}