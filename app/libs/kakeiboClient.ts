import { KakeiboQueries, GetListRequest, GetDetailRequest, AddRequest } from "../@types/types";

const isObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object';
};

const parseQuery = (queries: KakeiboQueries): string => {
    if (!isObject(queries)) {
        throw new Error('queries is not object');
    }
    const queryString = new URLSearchParams(
        Object.entries(queries).reduce(
            (acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = String(value);
                }
                return acc;
            },
            {} as Record<string, string>,
        ),
    ).toString();

    return queryString;
};

class KakeiboClient {
    private token: string;
    private baseUrl: string
    constructor(token: string) {
        this.token = token
        this.baseUrl = `http://localhost:5173/api`;
    }

    private async fetchKakeibo<T>(url: string, options?: RequestInit): Promise<T> {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        };
        const finalOptions = { ...defaultOptions, ...options };
        return fetch(url, finalOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json() as Promise<T>;
            })
            .catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
                throw error
            });
    }

    public async getListResponse<T>({ endpoint, queries }: GetListRequest): Promise<T> {
        let url = `${this.baseUrl}/${endpoint}`;
        if (queries) {
            const queryString = parseQuery(queries);
            url += '?' + queryString;
        }
        return this.fetchKakeibo<T>(url);
    }

    public async getDetail<T>({ endpoint, contentId }: GetDetailRequest): Promise<T> {
        let url = `${this.baseUrl}/${endpoint}/${contentId}`;
        return this.fetchKakeibo<T>(url);
    }

    public async addData<T>({ endpoint, data }: AddRequest): Promise<T> {
        const url = `${this.baseUrl}/${endpoint}`;
        const body = JSON.stringify(data);
        const options: RequestInit = {
            method: 'POST',
            body: body,
        };
        return this.fetchKakeibo<T>(url, options);
    }
}

export { KakeiboClient };
