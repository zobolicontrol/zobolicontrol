'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createContact, updateContact, type Contact } from '@/app/actions/contacts'

type ContactFormProps = {
  type: 'cliente' | 'fornecedor'
  contact?: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactForm({ type, contact, open, onOpenChange }: ContactFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    phone: contact?.phone || '',
    document: contact?.document || '',
    address: contact?.address || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      let result

      if (contact) {
        result = await updateContact(contact.id, formData)
      } else {
        result = await createContact(type, formData)
      }

      if (result.error) {
        toast.error('Erro ao salvar', {
          description: result.error,
        })
      } else {
        toast.success(contact ? 'Atualizado com sucesso!' : 'Criado com sucesso!')
        onOpenChange(false)
        setFormData({ name: '', phone: '', document: '', address: '' })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar' : 'Adicionar'} {type === 'cliente' ? 'Cliente' : 'Fornecedor'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do {type === 'cliente' ? 'cliente' : 'fornecedor'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isPending}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isPending}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                disabled={isPending}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={isPending}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
