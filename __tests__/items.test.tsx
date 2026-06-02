import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ItemsPage from '../app/(app)/items/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/items',
}))

let mockItemsData: any = null
let mockCreateMutate = vi.fn()
let mockUpdateMutate = vi.fn()
let mockDeleteMutate = vi.fn()
let mockDeleteError: any = null

vi.mock('@/lib/hooks/useInventory', () => ({
  useItems: (page = 1) => ({
    data: mockItemsData,
    isLoading: false,
  }),
  useCreateItem: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateItem: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
  useDeleteItem: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    error: mockDeleteError,
  }),
}))

describe('Items Page Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteError = null
    mockItemsData = [
      {
        id: 1,
        name: 'علف بادي 23%',
        unit: 'كجم',
        category: 'أعلاف',
        is_active: true,
      },
      {
        id: 2,
        name: 'لقاح ماريك',
        unit: 'وحدة',
        category: 'أدوية',
        is_active: false,
      }
    ]
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ItemsPage />
      </QueryClientProvider>
    )
  }

  it('renders items list correctly', () => {
    renderComponent()
    expect(screen.getByText('الأصناف')).toBeInTheDocument()
    expect(screen.getAllByText('علف بادي 23%')[0]).toBeInTheDocument()
    expect(screen.getAllByText('لقاح ماريك')[0]).toBeInTheDocument()
    expect(screen.getAllByText('نشط')[0]).toBeInTheDocument()
    expect(screen.getAllByText('غير نشط')[0]).toBeInTheDocument()
  })

  it('opens and submits edit form with whitelisted fields only', async () => {
    renderComponent()
    
    // Find the edit button for the first item
    const editBtns = screen.getAllByRole('button', { name: /تعديل/i })
    fireEvent.click(editBtns[0])

    expect(screen.getByText('تعديل الصنف')).toBeInTheDocument()

    // Find the inputs and edit the name
    const nameInput = screen.getByPlaceholderText('مثال: علف بادي 23%')
    fireEvent.change(nameInput, { target: { value: 'علف بادي معدل' } })

    // Find active checkbox and toggle it (uncheck it)
    const activeCheckbox = screen.getByLabelText(/الصنف نشط/i)
    expect(activeCheckbox).toBeChecked()
    fireEvent.click(activeCheckbox)
    expect(activeCheckbox).not.toBeChecked()

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /حفظ التعديلات/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          data: {
            name: 'علف بادي معدل',
            unit: 'كجم',
            category: 'أعلاف',
            is_active: false,
          }
        }),
        expect.any(Object)
      )
    })
  })

  it('opens delete confirmation and submits deletion successfully', async () => {
    renderComponent()

    const deleteBtns = screen.getAllByRole('button', { name: /حذف/i })
    fireEvent.click(deleteBtns[0])

    expect(screen.getAllByText('تأكيد الحذف')[0]).toBeInTheDocument()
    
    // Use custom text matcher to find text broken across sibling tags
    expect(screen.getByText((content, node) => {
      const hasText = (node: Element) =>
        node.textContent === 'هل أنت متأكد من رغبتك في حذف الصنف "علف بادي 23%"؟ لا يمكن التراجع عن هذا الإجراء.'
      const nodeHasText = hasText(node as Element)
      const childrenDontHaveText = Array.from(node?.children || []).every(
        child => !hasText(child)
      )
      return nodeHasText && childrenDontHaveText
    })).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'تأكيد الحذف' })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith(
        1,
        expect.any(Object)
      )
    })
  })

  it('displays a custom error message if delete fails due to active integrity constraint and allows deactivation instead', async () => {
    mockDeleteError = { message: 'لا يمكن حذف هذا الصنف لأنه مرتبط بعمليات استهلاك أعلاف أو حركات مخزنية نشطة.' }
    renderComponent()

    const deleteBtns = screen.getAllByRole('button', { name: /حذف/i })
    fireEvent.click(deleteBtns[0])

    expect(screen.getAllByText('تأكيد الحذف')[0]).toBeInTheDocument()

    // Verify it renders the beautiful custom error message cleanly
    expect(screen.getByText('لا يمكن حذف هذا الصنف لأنه مرتبط بعمليات استهلاك أعلاف أو حركات مخزنية نشطة.')).toBeInTheDocument()

    // Click the "Deactivate instead" button
    const deactivateBtn = screen.getByRole('button', { name: /إلغاء تنشيط الصنف بدلاً من ذلك/i })
    fireEvent.click(deactivateBtn)

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          data: {
            name: 'علف بادي 23%',
            unit: 'كجم',
            category: 'أعلاف',
            is_active: false,
          }
        }),
        expect.any(Object)
      )
    })
  })
})
