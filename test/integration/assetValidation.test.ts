import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { checkAssetCategoryDuplication } from '@/utils/assetValidation'
import { insert } from '../helpers/db'

describe('checkAssetCategoryDuplication（同じ月・同じカテゴリの資産は1件まで）', () => {
  const setup = async () => {
    const bank = await insert('asset_category', { name: '普通預金' })
    const stock = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    await insert('asset', { date: '2026-09-30', amount: 100, asset_category_id: bank })
    return { bank, stock }
  }

  it('同じ月・同じカテゴリがあれば true（日が違っても重複）', async () => {
    const { bank } = await setup()
    expect(
      await checkAssetCategoryDuplication({ db: env.DB, date: '2026-09-01', assetCategoryId: bank })
    ).toBe(true)
  })

  it('別カテゴリなら false', async () => {
    const { stock } = await setup()
    expect(
      await checkAssetCategoryDuplication({
        db: env.DB,
        date: '2026-09-30',
        assetCategoryId: stock,
      })
    ).toBe(false)
  })

  it.each(['2026-08-31', '2026-10-01'])('隣の月（%s）なら false', async (date) => {
    const { bank } = await setup()
    expect(await checkAssetCategoryDuplication({ db: env.DB, date, assetCategoryId: bank })).toBe(
      false
    )
  })

  it('excludeId に自分自身を渡すと、自分は重複とみなさない（更新時）', async () => {
    const bank = await insert('asset_category', { name: '普通預金' })
    const id = await insert('asset', { date: '2026-09-30', amount: 100, asset_category_id: bank })
    expect(
      await checkAssetCategoryDuplication({
        db: env.DB,
        date: '2026-09-01',
        assetCategoryId: bank,
        excludeId: id,
      })
    ).toBe(false)
    // 別の行を除外しても、自分が残るので重複
    expect(
      await checkAssetCategoryDuplication({
        db: env.DB,
        date: '2026-09-01',
        assetCategoryId: bank,
        excludeId: id + 1,
      })
    ).toBe(true)
  })

  it('資産が無ければ false', async () => {
    const bank = await insert('asset_category', { name: '普通預金' })
    expect(
      await checkAssetCategoryDuplication({ db: env.DB, date: '2026-09-15', assetCategoryId: bank })
    ).toBe(false)
  })
})
