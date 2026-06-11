import { expect, test, describe } from 'vitest'
import { cn, formatMontant, formatDate, formatDateShort, getInitials } from '@/lib/utils'

describe('cn', () => {
  test('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  test('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  test('handles undefined values', () => {
    expect(cn('a', undefined, 'b')).toBe('a b')
  })
})

describe('formatMontant', () => {
  test('formats montant en XOF', () => {
    const result = formatMontant(15000)
    expect(result).toContain('15')
    expect(result).toContain('000')
  })

  test('handles zero', () => {
    expect(formatMontant(0)).toContain('0')
  })
})

describe('formatDate', () => {
  test('formats date in French locale', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('janvier')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  test('handles Date object', () => {
    const result = formatDate(new Date(2024, 0, 15))
    expect(result).toContain('janvier')
  })
})

describe('formatDateShort', () => {
  test('formats short date', () => {
    const result = formatDateShort('2024-01-15')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })
})

describe('getInitials', () => {
  test('returns first letters uppercased', () => {
    expect(getInitials('koffi', 'ama')).toBe('KA')
  })

  test('handles empty strings', () => {
    expect(getInitials('', '')).toBe('')
  })
})
