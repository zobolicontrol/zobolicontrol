'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Transaction = {
  id: number
  type: 'entrada' | 'saida' | 'despesa'
  description: string
  transaction_date: string
  quantity?: number
  unit_price?: number
  amount: number
  contact_id?: number
  product_id?: number
  expense_type_id?: number
  user_id: string
  created_at: string
  updated_at: string
  // Joins
  contacts?: {
    name: string
    type: string
  }
  products?: {
    name: string
    unit: string
  }
  expense_types?: {
    name: string
  }
}

export type TransactionFormData = {
  type: 'entrada' | 'saida' | 'despesa'
  description: string
  transaction_date: string
  quantity?: number
  unit_price?: number
  amount: number
  contact_id?: number
  product_id?: number
  expense_type_id?: number
}

export async function getTransactions(type?: 'entrada' | 'saida' | 'despesa') {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select(`
      *,
      contacts(name, type),
      products(name, unit),
      expense_types(name)
    `)
    .order('transaction_date', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar transações:', error)
    return []
  }

  return data as Transaction[]
}

export async function getTransactionsByDateRange(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      contacts(name, type),
      products(name, unit),
      expense_types(name)
    `)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar transações por período:', error)
    return []
  }

  return data as Transaction[]
}

export async function createTransaction(formData: TransactionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      ...formData,
      user_id: user.id,
    })

  if (error) {
    console.error('Erro ao criar transação:', error)
    return { error: error.message }
  }

  revalidatePath('/lancamentos')
  revalidatePath('/')
  return { success: true }
}

export async function getDashboardMetrics(days: number = 30) {
  const supabase = await createClient()

  // Data de início (X dias atrás)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .gte('transaction_date', startDateStr)

  if (error) {
    console.error('Erro ao buscar métricas:', error)
    return {
      totalEntradas: 0,
      totalSaidas: 0,
      totalDespesas: 0,
      fluxoCaixa: 0,
    }
  }

  const totalEntradas = data
    .filter((t) => t.type === 'entrada')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalSaidas = data
    .filter((t) => t.type === 'saida')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalDespesas = data
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  // Fluxo de Caixa = Saídas (vendas) - Entradas (compras) - Despesas
  const fluxoCaixa = totalSaidas - totalEntradas - totalDespesas

  return {
    totalEntradas,
    totalSaidas,
    totalDespesas,
    fluxoCaixa,
  }
}

export async function getExpensesByCategory(month?: number, year?: number) {
  const supabase = await createClient()

  // Se não fornecer mês/ano, usar o mês atual
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()

  const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString()
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      expense_types(name)
    `)
    .eq('type', 'despesa')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) {
    console.error('Erro ao buscar despesas por categoria:', error)
    return []
  }

  // Agrupar por categoria
  const grouped = (data || []).reduce((acc: Record<string, number>, item) => {
    const expenseType = Array.isArray(item.expense_types) ? item.expense_types[0] : item.expense_types
    const category = expenseType?.name || 'Sem Categoria'
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += Number(item.amount) || 0
    return acc
  }, {} as Record<string, number>)

  return Object.entries(grouped).map(([name, amount]) => ({
    name,
    amount: amount as number,
  }))
}

export async function updateTransaction(id: number, formData: TransactionFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('transactions')
    .update(formData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar transação:', error)
    return { error: error.message }
  }

  revalidatePath('/lancamentos')
  revalidatePath('/lancamentos/vendas')
  revalidatePath('/lancamentos/compras')
  revalidatePath('/lancamentos/despesas')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTransaction(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir transação:', error)
    return { error: error.message }
  }

  revalidatePath('/lancamentos')
  revalidatePath('/lancamentos/vendas')
  revalidatePath('/lancamentos/compras')
  revalidatePath('/lancamentos/despesas')
  revalidatePath('/')
  return { success: true }
}

export async function getTransactionsPaginated(
  type: 'entrada' | 'saida' | 'despesa',
  page: number = 1,
  limit: number = 15,
  filters?: {
    contactId?: string
    startDate?: string
    endDate?: string
  }
) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from('transactions')
    .select(`
      *,
      contacts(name, type),
      products(name, unit),
      expense_types(name)
    `, { count: 'exact' })
    .eq('type', type)

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }

  const { data, error, count } = await query
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Erro ao buscar transações paginadas:', error)
    return { data: [], count: 0 }
  }

  return {
    data: data as Transaction[],
    count: count || 0,
  }
}
