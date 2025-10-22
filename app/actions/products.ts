'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Product = {
  id: number
  name: string
  description?: string
  unit: 'tonelada' | 'kg' | 'fardo' | 'timbrado' | 'unidade'
  created_at: string
  updated_at: string
}

export type ProductFormData = {
  name: string
  description?: string
  unit: 'tonelada' | 'kg' | 'fardo' | 'timbrado' | 'unidade'
}

export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }

  return data as Product[]
}

export async function createProduct(formData: ProductFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .insert(formData)

  if (error) {
    console.error('Erro ao criar produto:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/produtos')
  return { success: true }
}

export async function updateProduct(id: number, formData: ProductFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update(formData)
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar produto:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/produtos')
  return { success: true }
}

export async function deleteProduct(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar produto:', error)
    return { error: error.message }
  }

  revalidatePath('/cadastros/produtos')
  return { success: true }
}
