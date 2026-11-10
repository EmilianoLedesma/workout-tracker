import { act, renderHook } from '@testing-library/react'
import { useNow } from './useNow'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1000)
})
afterEach(() => {
  vi.useRealTimers()
})

it('follows the clock while active', () => {
  const { result } = renderHook(() => useNow(true))
  expect(result.current).toBe(1000)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(result.current).toBe(1500)
})

it('stands still while inactive', () => {
  const { result } = renderHook(() => useNow(false))
  act(() => {
    vi.advanceTimersByTime(5000)
  })
  expect(result.current).toBe(1000)
})

it('refreshes at once when the page becomes visible again', () => {
  const { result } = renderHook(() => useNow(true, 100000))
  vi.setSystemTime(9000)
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(result.current).toBe(9000)
})
