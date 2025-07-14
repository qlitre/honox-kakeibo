/**
 * 現在の日付を日本時間（UTC+9）で取得し、yyyy-mm-dd形式で返す
 * @returns {string} 現在の日付（yyyy-mm-dd形式）
 */
export const getTodayDate = (): string => {
  const now = new Date();
  // UTC+9（日本時間）を適用
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  // 年、月、日を取得
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0"); // 月は0始まりのため+1
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  // yyyy-mm-dd形式で返す
  return `${year}-${month}-${day}`;
};