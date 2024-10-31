import { KakeiboQueries, GetListRequest } from "../@types/types";

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

    private async fetchKakeibo<T>(url: string): Promise<T> {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        };

        return fetch(url, options)
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

    public async getDetail<T>(endpoint: string, contentId: string, queries?: KakeiboQueries): Promise<T> {
        let url = `${this.baseUrl}/${endpoint}/${contentId}`;
        if (queries) {
            const queryString = parseQuery(queries);
            url += '?' + queryString;
        }

        return this.fetchKakeibo<T>(url);
    }
}

export { KakeiboClient };
