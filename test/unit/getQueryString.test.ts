import { describe, expect, it } from 'vitest'
import { getQueryString } from '@/utils/getQueryString'

const BASE = 'http://localhost'

describe('getQueryString', () => {
  it('lastUpdate を除いたクエリ文字列を ? 無しで返す', () => {
    expect(getQueryString('/auth/expense?page=2&lastUpdate=10&month=2026-09', BASE)).toBe(
      'page=2&month=2026-09'
    )
  })

  it('クエリが無ければ空文字', () => {
    expect(getQueryString('/auth/expense', BASE)).toBe('')
    expect(getQueryString('/auth/expense?lastUpdate=1', BASE)).toBe('')
  })

  it('絶対URLでも動き、値はエンコードされたまま返す', () => {
    expect(
      getQueryString('https://example.com/auth/expense?keyword=%E3%83%A9%E3%83%B3%E3%83%81', BASE)
    ).toBe('keyword=%E3%83%A9%E3%83%B3%E3%83%81')
  })
})
