'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Contact = {
  id: number
  name: string
  type: 'cliente' | 'fornecedor'
  phone?: string
  document?: string
  address?: string
  created_at: string
  updated_at: string
}

export type ContactFormData = {
  name: string
  phone?: string
  document?: string
  address?: string
}

export async function getContacts(type: 'cliente' | 'fornecedor') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('type', type)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar contatos:', error)
    return []
  }

  return data as Contact[]
}

export async function createContact(type: 'cliente' | 'fornecedor', formData: ContactFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .insert({
      ...formData,
      type,
    })

  if (error) {
    console.error('Erro ao criar contato:', error)
    return { error: error.message }
  }

  revalidatePath(`/cadastros/${type === 'cliente' ? 'clientes' : 'fornecedores'}`)
  return { success: true }
}

export async function updateContact(id: number, formData: ContactFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .update(formData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar contato:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/clientes')
  revalidatePath('/cadastros/fornecedores')
  return { success: true }
}

export async function deleteContact(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar contato:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/clientes')
  revalidatePath('/cadastros/fornecedores')
  return { success: true }
}
