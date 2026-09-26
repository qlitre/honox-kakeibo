import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import mcpApp from '@/routes/mcp'
import { getTodayDate } from '@/utils/dateUtils'
import { count, row, seedExpenseMasters } from '../../helpers/db'

// OAuth（OAuthProvider）の手前にある MCP アプリへ直接 JSON-RPC を送って、ツールの挙動を検証する

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const res = await mcpApp.fetch(
    new Request('http://localhost/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    }),
    env
  )
  expect(res.status).toBe(200)
  // SSE の "data: {...}" 行から JSON-RPC の応答を取り出す
  const data = (await res.text()).split('\n').find((l) => l.startsWith('data: '))!
  return JSON.parse(data.slice('data: '.length)).result as {
    content: { type: string; text: string }[]
    isError?: boolean
  }
}

const json = (result: Awaited<ReturnType<typeof callTool>>) => JSON.parse(result.content[0].text)

describe('MCPツール', () => {
  it('get_expense_categories / get_payment_methods は id と name だけを返す', async () => {
    await seedExpenseMasters()
    expect(json(await callTool('get_expense_categories'))).toEqual([
      { id: 1, name: '食費' },
      { id: 2, name: '家賃' },
    ])
    expect(json(await callTool('get_payment_methods'))).toEqual([
      { id: 1, name: '現金' },
      { id: 2, name: 'クレジットカード' },
    ])
  })

  it('add_payment で支出を登録し、登録内容を返す', async () => {
    const m = await seedExpenseMasters()
    const result = await callTool('add_payment', {
      amount: 1200,
      expense_category_id: m.foodId,
      payment_method_id: m.cardId,
      date: '2026-09-01',
      description: 'ランチ',
    })
    expect(json(result)).toMatchObject({
      amount: 1200,
      category_name: '食費',
      description: 'ランチ',
    })
    expect(await row('expense', 1)).toMatchObject({ date: '2026-09-01', amount: 1200 })
  })

  it('add_payment で日付・メモを省略すると、今日（JST）と空文字で登録する', async () => {
    const m = await seedExpenseMasters()
    await callTool('add_payment', {
      amount: 500,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    expect(await row('expense', 1)).toMatchObject({ date: getTodayDate(), description: '' })
  })

  it.each([
    ['金額が0', { amount: 0 }],
    ['金額が小数', { amount: 1.5 }],
    ['日付の形式が違う', { date: '2026/09/01' }],
  ])('add_payment の入力エラー（%s）は isError で、登録しない', async (_, override) => {
    const m = await seedExpenseMasters()
    const result = await callTool('add_payment', {
      amount: 100,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      ...override,
    })
    expect(result.isError).toBe(true)
    expect(await count('expense')).toBe(0)
  })

  it('add_payment で存在しないカテゴリは isError で、登録しない', async () => {
    const m = await seedExpenseMasters()
    const result = await callTool('add_payment', {
      amount: 100,
      expense_category_id: 999,
      payment_method_id: m.cashId,
    })
    expect(result.isError).toBe(true)
    expect(await count('expense')).toBe(0)
  })
})
