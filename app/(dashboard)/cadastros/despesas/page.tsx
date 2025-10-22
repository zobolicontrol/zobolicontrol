'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType, type ExpenseType } from '@/app/actions/expense-types'
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TiposDespesaPage() {
  const [tipos, setTipos] = useState<ExpenseType[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<ExpenseType | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<ExpenseType | null>(null)
  const [isPending, setIsPending] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
  })

  const loadTipos = async () => {
    setLoading(true)
    const data = await getExpenseTypes()
    setTipos(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTipos()
  }, [])

  const handleEdit = (type: ExpenseType) => {
    setEditingType(type)
    setFormData({ name: type.name })
    setFormOpen(true)
  }

  const handleDelete = async (type: ExpenseType) => {
    setTypeToDelete(type)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!typeToDelete) return

    const result = await deleteExpenseType(typeToDelete.id)
    if (result.error) {
      toast.error('Erro ao excluir', {
        description: result.error,
      })
    } else {
      toast.success('Tipo de despesa excluído com sucesso!')
      loadTipos()
    }
    setDeleteDialogOpen(false)
    setTypeToDelete(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    let result

    if (editingType) {
      result = await updateExpenseType(editingType.id, formData)
    } else {
      result = await createExpenseType(formData)
    }

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao salvar', {
        description: result.error,
      })
    } else {
      toast.success(editingType ? 'Tipo atualizado com sucesso!' : 'Tipo criado com sucesso!')
      setFormOpen(false)
      setEditingType(undefined)
      setFormData({ name: '' })
      loadTipos()
    }
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingType(undefined)
      setFormData({ name: '' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Despesa</h1>
          <p className="text-muted-foreground">Gerencie as categorias de despesas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tipo
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : tipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  Nenhum tipo de despesa cadastrado
                </TableCell>
              </TableRow>
            ) : (
              tipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(tipo)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(tipo)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={handleFormClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Editar' : 'Adicionar'} Tipo de Despesa</DialogTitle>
            <DialogDescription>Preencha o nome do tipo de despesa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  disabled={isPending}
                  placeholder="Ex: Combustível, Manutenção, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFormClose(false)}
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

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o tipo de despesa &quot;{typeToDelete?.name}&quot;?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
