import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendSlackNotification } from '@/libs/slack'

const URL = 'https://slack.test/webhook'

describe('sendSlackNotification', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('Webhookに text をJSONでPOSTする', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
    await sendSlackNotification('支出が追加されました。', URL)
    expect(fetchMock).toHaveBeenCalledWith(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '支出が追加されました。' }),
    })
    expect(console.error).not.toHaveBeenCalled()
  })

  it('Slackがエラーを返しても例外にしない（登録処理を止めない）', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ng', { status: 500 }))
    await expect(sendSlackNotification('x', URL)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith('Slack通知失敗: ステータスコード 500')
  })

  it('通信エラーでも例外にしない', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'))
    await expect(sendSlackNotification('x', URL)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith('Slack通知中にエラー:', expect.any(TypeError))
  })
})
