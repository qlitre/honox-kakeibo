import type {
    KakeiboClientOptions,
    KakeiboQueries,
    GetListRequest,
    GetSummaryRequest,
    GetDetailRequest,
    AddRequest,
    UpdateRequest,
    DeleteRequest
} from "@/@types/types";


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
    private baseUrl: string;

    constructor({ token, baseUrl }: KakeiboClientOptions) {
        this.token = token;
        this.baseUrl = baseUrl;
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
            .then(async (response) => {
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    let errorMessage = response.statusText;

                    if (isObject(errorBody) && 'error' in errorBody && typeof errorBody.error === 'string') {
                        errorMessage = errorBody.error;
                    }

                    throw new Error(errorMessage);
                }
                return response.json() as Promise<T>;
            })
            .catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
                throw error;
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

    public async getSummaryResponse<T>({ endpoint, queries }: GetSummaryRequest): Promise<T> {
        let url = `${this.baseUrl}/${endpoint}/summary`;
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
    public async updateData<T>({ endpoint, contentId, data }: UpdateRequest): Promise<T> {
        const url = `${this.baseUrl}/${endpoint}/${contentId}`;
        const body = JSON.stringify(data);
        const options: RequestInit = {
            method: 'PUT',
            body: body,
        };
        return this.fetchKakeibo<T>(url, options);
    }

    public async deleteData<T>({ endpoint, contentId }: DeleteRequest): Promise<T> {
        const url = `${this.baseUrl}/${endpoint}/${contentId}`;
        const options: RequestInit = {
            method: 'DELETE',
        };
        return this.fetchKakeibo<T>(url, options);
    }
}

export { KakeiboClient };