import { expect, test, describe, vi } from 'vitest'
import { exportCSV } from '@/lib/export'

describe('exportCSV', () => {
  test('creates a CSV link and clicks it', () => {
    const clickSpy = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement)

    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')

    exportCSV('test-file', ['Nom', 'Prénom'], [['Koffi', 'Ama']])

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    revokeSpy.mockRestore()
    createObjectURLSpy.mockRestore()
  })
})
