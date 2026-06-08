import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequestRaw } from '@/lib/api/client'

describe('apiRequestRaw', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves JSON body fields when using DELETE method override', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await apiRequestRaw('/nursery/manage/basins/210/activities', {
      method: 'DELETE',
      body: JSON.stringify({
        items: [{ id: 12, type: 'cycle' }],
      }),
    })

    const [, options] = fetchMock.mock.calls[0]
    expect(options).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    })

    const body = new URLSearchParams(String(options?.body))
    expect(body.get('_method')).toBe('DELETE')
    expect(body.get('items[0][id]')).toBe('12')
    expect(body.get('items[0][type]')).toBe('cycle')
  })
})
