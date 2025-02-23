export const getQueryString = (urlString: string, base_url: string) => {
    const url = new URL(urlString, base_url); // ベースURLを指定
    url.searchParams.delete('lastUpdate'); // lastUpdate を削除
    return url.search.substring(1)
}