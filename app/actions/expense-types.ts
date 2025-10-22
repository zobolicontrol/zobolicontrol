'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ExpenseType = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export type ExpenseTypeFormData = {
  name: string
}

export async function getExpenseTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expense_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar tipos de despesa:', error)
    return []
  }

  return data as ExpenseType[]
}

export async function createExpenseType(formData: ExpenseTypeFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expense_types')
    .insert(formData)

  if (error) {
    console.error('Erro ao criar tipo de despesa:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/despesas')
  return { success: true }
}

export async function updateExpenseType(id: number, formData: ExpenseTypeFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expense_types')
    .update(formData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar tipo de despesa:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/despesas')
  return { success: true }
}

export async function deleteExpenseType(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expense_types')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar tipo de despesa:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/despesas')
  return { success: true }
}
