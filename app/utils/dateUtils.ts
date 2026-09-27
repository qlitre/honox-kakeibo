/**
 * 現在の日付を日本時間（UTC+9）で取得し、yyyy-mm-dd形式で返す
 * @returns {string} 現在の日付（yyyy-mm-dd形式）
 */
export const getTodayDate = (): string => {
  const now = new Date()
  // UTC+9（日本時間）を適用
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  // 年、月、日を取得
  const year = jstDate.getUTCFullYear()
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0') // 月は0始まりのため+1
  const day = String(jstDate.getUTCDate()).padStart(2, '0')
  // yyyy-mm-dd形式で返す
  return `${year}-${month}-${day}`
}

/**
 * yyyy-mm-dd の年・月を返す。形式が不正なら日本時間の今日の年・月
 */
export const getYearMonth = (date: string = getTodayDate()): { year: number; month: number } => {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(date)
  if (!match) return getYearMonth()
  return { year: Number(match[1]), month: Number(match[2]) }
}
