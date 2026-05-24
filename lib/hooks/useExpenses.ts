'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expensesApi, ExpenseRecord } from '../api/organization'

// Barn Expenses Hooks
export function useBarnExpenses(barnId: number) {
  return useQuery({
    queryKey: ['barn-expenses', barnId],
    queryFn: () => expensesApi.listBarnExpenses(barnId),
    enabled: !!barnId,
  })
}

export function useCreateBarnExpense(barnId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      expense_date: string
      amount: number
      category: string
      description?: string
    }) => expensesApi.createBarnExpense(barnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barn-expenses', barnId] })
    },
  })
}

export function useDeleteBarnExpense(barnId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: number) => expensesApi.deleteBarnExpense(barnId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barn-expenses', barnId] })
    },
  })
}

// Flock Expenses Hooks
export function useFlockExpenses(flockId: number) {
  return useQuery({
    queryKey: ['flock-expenses', flockId],
    queryFn: () => expensesApi.listFlockExpenses(flockId),
    enabled: !!flockId,
  })
}

export function useCreateFlockExpense(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      expense_date: string
      amount: number
      category: string
      description?: string
    }) => expensesApi.createFlockExpense(flockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock-expenses', flockId] })
    },
  })
}

export function useDeleteFlockExpense(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: number) => expensesApi.deleteFlockExpense(flockId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock-expenses', flockId] })
    },
  })
}
