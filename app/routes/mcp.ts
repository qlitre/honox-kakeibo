import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Hono } from 'hono'
import type { Env } from 'hono'
import { createItem, fetchListWithFilter, fetchSimpleList } from '@/libs/dbService'
import { getTodayDate, getYearMonth } from '@/utils/dateUtils'
import {
  getPrevMonthYear,
  getPrevMonth,
  getBeginningOfMonth,
  getEndOfMonth,
  getAnnualStartYear,
} from '@/utils/dashboardUtils'
import { buildAssetSummary } from '@/utils/dashboardAggregates'
import { annualStartMonth } from '@/settings/kakeiboSettings'
import type { Expense } from '@/@types/dbTypes'

export const getMcpServer = async (c: Context<Env>) => {
  const server = new McpServer({
    name: 'kakeibo MCP Server',
    version: '0.0.1',
  })

  server.registerTool(
    'add_payment',
    {
      title: 'Add Payment',
      description:
        '支出（支払い）を1件登録する。日付を省略した場合は日本時間の今日日付で登録される。',
      inputSchema: z.object({
        amount: z.number().int().positive().describe('金額（円）'),
        expense_category_id: z.number().int().positive().describe('支出カテゴリID'),
        payment_method_id: z.number().int().positive().describe('支払い方法ID'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'yyyy-mm-dd形式で指定してください')
          .optional()
          .describe('支払い日（yyyy-mm-dd）。省略時は今日'),
        description: z.string().optional().describe('メモ・内容'),
      }),
    },
    async (params: {
      amount: number
      expense_category_id: number
      payment_method_id: number
      date?: string
      description?: string
    }) => {
      const { amount, expense_category_id, payment_method_id, date, description } = params
      const expense = await createItem({
        db: c.env.DB,
        table: 'expense',
        data: {
          date: date ?? getTodayDate(),
          amount,
          expense_category_id,
          payment_method_id,
          description: description ?? '',
        },
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(expense, null, 2) }],
      }
    }
  )

  server.registerTool(
    'get_expense_categories',
    {
      title: 'Get Expense Categories',
      description:
        '支出カテゴリの一覧を取得する。add_paymentで指定するexpense_category_idはここで確認できる。',
    },
    async () => {
      const { contents } = await fetchSimpleList({
        db: c.env.DB,
        table: 'expense_category',
      })
      const categories = contents.map(({ id, name }) => ({ id, name }))
      return {
        content: [{ type: 'text', text: JSON.stringify(categories, null, 2) }],
      }
    }
  )

  server.registerTool(
    'get_payment_methods',
    {
      title: 'Get Payment Methods',
      description:
        '支払い方法の一覧を取得する。add_paymentで指定するpayment_method_idはここで確認できる。',
    },
    async () => {
      const { contents } = await fetchSimpleList({
        db: c.env.DB,
        table: 'payment_method',
      })
      const methods = contents.map(({ id, name }) => ({ id, name }))
      return {
        content: [{ type: 'text', text: JSON.stringify(methods, null, 2) }],
      }
    }
  )

  server.registerTool(
    'get_assets',
    {
      title: 'Get Assets',
      description:
        '指定月の資産状況を取得する。カテゴリ別の金額、合計、前月比・年初比の増減を返す。年月を省略した場合は日本時間の今月。',
      inputSchema: z.object({
        year: z.number().int().min(2000).max(2100).optional().describe('年（例: 2026）。省略時は今年'),
        month: z.number().int().min(1).max(12).optional().describe('月（1〜12）。省略時は今月'),
      }),
    },
    async (params: { year?: number; month?: number }) => {
      const today = getYearMonth()
      const year = params.year ?? today.year
      const month = params.month ?? today.month
      const db = c.env.DB

      // その月に登録された資産（カテゴリごとに月1件）
      const assetsOf = async (y: number, m: number) => {
        const { contents } = await fetchListWithFilter({
          db,
          table: 'asset',
          filters: [
            { field: 'date', op: 'gte', value: getBeginningOfMonth(y, m) },
            { field: 'date', op: 'lte', value: getEndOfMonth(y, m) },
          ],
          limit: 100,
          offset: 0,
        })
        return contents
      }

      const [assets, prevAssets, annualStartAssets] = await Promise.all([
        assetsOf(year, month),
        assetsOf(getPrevMonthYear(year, month), getPrevMonth(month)),
        assetsOf(getAnnualStartYear(year, month), annualStartMonth),
      ])
      const summary = buildAssetSummary(assets, prevAssets, annualStartAssets)

      const result = {
        year,
        month,
        total_amount: summary.totalAmount,
        prev_month_diff: summary.prevTotalDiff,
        prev_month_diff_ratio: summary.prevTotalDiffRatio,
        annual_start_diff: summary.annualTotalDiff,
        annual_start_diff_ratio: summary.annualTotalDiffRatio,
        categories: Object.values(summary.tableItems).map((item) => ({
          name: item.categoryName,
          amount: item.now,
          prev_month_diff: item.prevDiff,
          prev_month_diff_ratio: item.prevDiffRatio,
          annual_start_diff: item.annualStartDiff,
          annual_start_diff_ratio: item.annualStartDiffRatio,
        })),
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  return server
}

const app = new Hono<Env>()

app.all('/mcp', async (c) => {
  const mcpServer = await getMcpServer(c)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  await mcpServer.connect(transport)
  return transport.handleRequest(c.req.raw)
})

app.onError((err, c) => {
  console.log(err.message)

  if (err instanceof HTTPException && err.res) {
    return err.res
  }

  return c.json(
    {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
      },
      id: null,
    },
    500
  )
})

export default app
