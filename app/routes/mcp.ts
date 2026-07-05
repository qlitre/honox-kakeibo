import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { Hono } from 'hono'
import type { Env } from 'hono'
import { createItem, fetchSimpleList } from '@/libs/dbService'
import { getTodayDate } from '@/utils/dateUtils'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/@types/dbTypes'

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
      inputSchema: {
        amount: z.number().int().positive().describe('金額（円）'),
        expense_category_id: z.number().int().positive().describe('支出カテゴリID'),
        payment_method_id: z.number().int().positive().describe('支払い方法ID'),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'yyyy-mm-dd形式で指定してください')
          .optional()
          .describe('支払い日（yyyy-mm-dd）。省略時は今日'),
        description: z.string().optional().describe('メモ・内容'),
      },
    },
    async (params: {
      amount: number
      expense_category_id: number
      payment_method_id: number
      date?: string
      description?: string
    }) => {
      const { amount, expense_category_id, payment_method_id, date, description } = params
      const expense = await createItem<Expense>({
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
      const { contents } = await fetchSimpleList<ExpenseCategory>({
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
      const { contents } = await fetchSimpleList<PaymentMethod>({
        db: c.env.DB,
        table: 'payment_method',
      })
      const methods = contents.map(({ id, name }) => ({ id, name }))
      return {
        content: [{ type: 'text', text: JSON.stringify(methods, null, 2) }],
      }
    }
  )

  return server
}

const app = new Hono<Env>()

app.all('/mcp', async (c) => {
  const mcpServer = await getMcpServer(c)
  const transport = new StreamableHTTPTransport()
  await mcpServer.connect(transport)
  return transport.handleRequest(c)
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
