import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import AssetWizardForm from '../components/assets/AssetWizardForm'
import type { Asset } from '@/lib/types'

describe('Capital Assets Wizard Form Tests', () => {
  const mockOnSubmit = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Step 1 (البيانات الأساسية) and validates inputs', async () => {
    render(
      <AssetWizardForm
        editingAsset={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        isPending={false}
        serverErrors={{}}
      />
    )

    expect(screen.getByText('البيانات الأساسية')).toBeInTheDocument()
    
    // Find Next button
    const nextBtn = screen.getByRole('button', { name: /التالي/i })
    
    // Clicking next without filling should show validation errors
    fireEvent.click(nextBtn)
    expect(screen.getByText('الاسم العربي مطلوب')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('advances from Step 1 to Step 2 to Step 3 and submits only at the end', async () => {
    const { container } = render(
      <AssetWizardForm
        editingAsset={null}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        isPending={false}
        serverErrors={{}}
      />
    )

    // --- STEP 1: Basic Info ---
    // Fill the required name
    const nameInput = container.querySelector('input[type="text"]:nth-of-type(2)') as HTMLInputElement
    // Or we can find by label or placeholder or name
    // Let's use name or input index or let's use the code input
    const inputs = container.querySelectorAll('input')
    // input 0 is code, input 1 is name (Arabic), input 2 is English name
    fireEvent.change(inputs[1], { target: { value: 'جرار زراعي 1' } })

    // Click Next
    const nextBtn1 = screen.getByRole('button', { name: /التالي/i })
    fireEvent.click(nextBtn1)

    // Wait and verify we advanced to Step 2 (البيانات المالية)
    await waitFor(() => {
      expect(screen.getByText('البيانات المالية والإهلاك')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()

    // --- STEP 2: Financial Info ---
    // Fill required financial values
    // purchase_value, book_value, calculation_rate
    const purchaseInput = screen.getByLabelText(/قيمة الشراء/i)
    const bookValueInput = screen.getByLabelText(/القيمة الدفترية المتبقية/i)
    const calcRateInput = screen.getByLabelText(/معدل الإهلاك السنوي/i)

    fireEvent.change(purchaseInput, { target: { value: '150000' } })
    fireEvent.change(bookValueInput, { target: { value: '120000' } })
    fireEvent.change(calcRateInput, { target: { value: '5000' } })

    // Click Next on Step 2
    const nextBtn2 = screen.getByRole('button', { name: /التالي/i })
    fireEvent.click(nextBtn2)

    // VERIFY: We should now be on Step 3 (المواصفات الفرعية) instead of form being submitted!
    await waitFor(() => {
      expect(screen.getByText(/المواصفات والخصائص الفرعية/i)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()

    // --- STEP 3: Sub-data/Polymorphic Details ---
    // The submit button text should be "إضافة الأصل للموازنة"
    const submitBtn = screen.getByRole('button', { name: /إضافة الأصل للموازنة/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })
})
