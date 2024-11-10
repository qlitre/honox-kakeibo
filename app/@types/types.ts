export type KakeiboClientOptions = {
    token: string;
    baseUrl: string;
}

export type KakeiboQueries = {
    limit?: number;
    offset?: number;
    orders?: string;
    fields?: string | string[];
    filters?: string;
    groupby?: string;
}

export type GetListRequest = {
    endpoint: string;
    queries?: KakeiboQueries;
}

export type GetSummaryRequest = {
    endpoint: string
    queries?: KakeiboQueries
}

export type AddRequest = {
    endpoint: string;
    data: Record<string, any>;
}

export type GetDetailRequest = {
    endpoint: string;
    contentId: string;
}

export type UpdateRequest = {
    endpoint: string;
    contentId: string;
    data: Record<string, any>;
}

export type DeleteRequest = {
    endpoint: string;
    contentId: string;
}