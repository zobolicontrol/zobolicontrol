'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FinancialAccount = {
  id: number
  type: 'pagar' | 'receber'
  description: string
  contact_id?: number
  transaction_id?: number
  due_date: string
  issue_date: string
  amount: number
  amount_paid: number
  status: 'pendente' | 'parcial' | 'pago' | 'vencido'
  payment_date?: string
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
  // Joins
  contacts?: {
    name: string
    phone?: string
    type: string
  }
}

export type PaymentHistory = {
  id: number
  financial_account_id: number
  payment_date: string
  amount: number
  payment_method?: string
  notes?: string
  user_id: string
  created_at: string
}

export type FinancialAccountFormData = {
  type: 'pagar' | 'receber'
  description: string
  contact_id?: number
  transaction_id?: number
  due_date: string
  issue_date?: string
  amount: number
  notes?: string
}

export type PaymentFormData = {
  payment_date: string
  amount: number
  payment_method?: string
  notes?: string
}

// ============================================
// CONTAS A PAGAR/RECEBER
// ============================================

export async function getFinancialAccounts(
  type?: 'pagar' | 'receber',
  filters?: {
    status?: string
    contactId?: string
    startDate?: string
    endDate?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('financial_accounts')
    .select(`
      *,
      contacts(name, phone, type)
    `)
    .order('due_date', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId)
  }

  if (filters?.startDate) {
    query = query.gte('due_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('due_date', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contas financeiras:', error)
    return []
  }

  return data as FinancialAccount[]
}

export async function getFinancialAccountById(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('financial_accounts')
    .select(`
      *,
      contacts(name, phone, type)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar conta financeira:', error)
    return null
  }

  return data as FinancialAccount
}

export async function createFinancialAccount(formData: FinancialAccountFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('financial_accounts')
    .insert({
      ...formData,
      user_id: user.id,
    })

  if (error) {
    console.error('Erro ao criar conta financeira:', error)
    return { error: error.message }
  }

  revalidatePath('/financeiro/contas-pagar')
  revalidatePath('/financeiro/contas-receber')
  revalidatePath('/financeiro/fluxo-caixa')
  return { success: true }
}

export async function updateFinancialAccount(id: number, formData: Partial<FinancialAccountFormData>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('financial_accounts')
    .update(formData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar conta financeira:', error)
    return { error: error.message }
  }

  revalidatePath('/financeiro/contas-pagar')
  revalidatePath('/financeiro/contas-receber')
  revalidatePath('/financeiro/fluxo-caixa')
  return { success: true }
}

export async function deleteFinancialAccount(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('financial_accounts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar conta financeira:', error)
    return { error: error.message }
  }

  revalidatePath('/financeiro/contas-pagar')
  revalidatePath('/financeiro/contas-receber')
  revalidatePath('/financeiro/fluxo-caixa')
  return { success: true }
}

// ============================================
// PAGAMENTOS
// ============================================

export async function getPaymentHistory(financialAccountId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .eq('financial_account_id', financialAccountId)
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error)
    return []
  }

  return data as PaymentHistory[]
}

export async function addPayment(financialAccountId: number, formData: PaymentFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('payment_history')
    .insert({
      financial_account_id: financialAccountId,
      ...formData,
      user_id: user.id,
    })

  if (error) {
    console.error('Erro ao adicionar pagamento:', error)
    return { error: error.message }
  }

  revalidatePath('/financeiro/contas-pagar')
  revalidatePath('/financeiro/contas-receber')
  revalidatePath('/financeiro/fluxo-caixa')
  return { success: true }
}

// ============================================
// RESUMOS E RELATÓRIOS
// ============================================

export async function getFinancialSummary() {
  const supabase = await createClient()

  // Contas a Pagar
  const { data: contasPagar } = await supabase
    .from('financial_accounts')
    .select('status, amount, amount_paid')
    .eq('type', 'pagar')

  // Contas a Receber
  const { data: contasReceber } = await supabase
    .from('financial_accounts')
    .select('status, amount, amount_paid')
    .eq('type', 'receber')

  const calcularTotais = (contas: Array<{ status: string; amount: number; amount_paid: number }>) => {
    return contas?.reduce(
      (acc, conta) => ({
        total: acc.total + (conta.amount || 0),
        pago: acc.pago + (conta.amount_paid || 0),
        pendente: acc.pendente + ((conta.amount || 0) - (conta.amount_paid || 0)),
        vencido: conta.status === 'vencido'
          ? acc.vencido + ((conta.amount || 0) - (conta.amount_paid || 0))
          : acc.vencido,
      }),
      { total: 0, pago: 0, pendente: 0, vencido: 0 }
    ) || { total: 0, pago: 0, pendente: 0, vencido: 0 }
  }

  return {
    contasPagar: calcularTotais(contasPagar || []),
    contasReceber: calcularTotais(contasReceber || []),
  }
}

export async function getOverdueAccounts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('financial_accounts')
    .select(`
      *,
      contacts(name, phone, type)
    `)
    .in('status', ['pendente', 'parcial', 'vencido'])
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Erro ao buscar contas vencidas:', error)
    return []
  }

  return data as FinancialAccount[]
}

export async function getDueThisMonth() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('financial_accounts')
    .select(`
      *,
      contacts(name, phone, type)
    `)
    .in('status', ['pendente', 'parcial'])
    .gte('due_date', startOfMonth)
    .lte('due_date', endOfMonth)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Erro ao buscar contas do mês:', error)
    return []
  }

  return data as FinancialAccount[]
}

// ============================================
// FLUXO DE CAIXA CONSOLIDADO
// ============================================

export async function getCashFlow(startDate: string, endDate: string) {
  const supabase = await createClient()

  // Buscar transações do período
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: true })

  // Buscar pagamentos realizados no período
  const { data: payments } = await supabase
    .from('payment_history')
    .select(`
      *,
      financial_accounts(type, description, contacts(name))
    `)
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date', { ascending: true })

  return {
    transactions: transactions || [],
    payments: payments || [],
  }
}
