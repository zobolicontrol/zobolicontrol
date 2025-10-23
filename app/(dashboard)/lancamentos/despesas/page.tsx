'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Combobox } from '@/components/ui/combobox'
import { Plus, MoreVertical, Pencil, Trash2, CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getTransactionsPaginated,
  updateTransaction,
  deleteTransaction,
  createTransaction,
  type Transaction,
  type TransactionFormData,
} from '@/app/actions/transactions'
import { getContacts, type Contact } from '@/app/actions/contacts'
import { getExpenseTypes, type ExpenseType } from '@/app/actions/expense-types'

export default function DespesasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fornecedores, setFornecedores] = useState<Contact[]>([])
  const [tiposDespesa, setTiposDespesa] = useState<ExpenseType[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 15

  // Filters
  const [filterFornecedorId, setFilterFornecedorId] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState<Date>()
  const [filterEndDate, setFilterEndDate] = useState<Date>()
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    description: '',
    transaction_date: new Date(),
    contact_id: '',
    expense_type_id: '',
    amount: '',
  })

  const loadTransactions = useCallback(async () => {
    setLoading(true)

    const filters = {
      contactId: filterFornecedorId !== 'all' ? filterFornecedorId : undefined,
      startDate: filterStartDate?.toISOString().split('T')[0],
      endDate: filterEndDate?.toISOString().split('T')[0],
    }

    const { data, count } = await getTransactionsPaginated('despesa', currentPage, itemsPerPage, filters)
    setTransactions(data)
    setTotalCount(count)
    setLoading(false)
  }, [currentPage, filterFornecedorId, filterStartDate, filterEndDate])

  const loadInitialData = async () => {
    const [fornecedoresData, tiposData] = await Promise.all([
      getContacts('fornecedor'),
      getExpenseTypes(),
    ])
    setFornecedores(fornecedoresData)
    setTiposDespesa(tiposData)
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      transaction_date: new Date(transaction.transaction_date),
      contact_id: transaction.contact_id?.toString() || '',
      expense_type_id: transaction.expense_type_id?.toString() || '',
      amount: transaction.amount.toString(),
    })
    setFormOpen(true)
  }

  const handleDelete = async (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!transactionToDelete) return

    const result = await deleteTransaction(transactionToDelete.id)
    if (result.error) {
      toast.error('Erro ao excluir', {
        description: result.error,
      })
    } else {
      toast.success('Despesa excluída com sucesso!')
      loadTransactions()
    }
    setDeleteDialogOpen(false)
    setTransactionToDelete(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const transactionData: TransactionFormData = {
      type: 'despesa',
      description: formData.description,
      transaction_date: formData.transaction_date.toISOString(),
      contact_id: formData.contact_id && formData.contact_id !== 'none' ? parseInt(formData.contact_id) : undefined,
      expense_type_id: parseInt(formData.expense_type_id),
      amount: parseFloat(formData.amount),
    }

    let result
    if (editingTransaction) {
      result = await updateTransaction(editingTransaction.id, transactionData)
    } else {
      result = await createTransaction(transactionData)
    }

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao salvar', {
        description: result.error,
      })
    } else {
      toast.success(editingTransaction ? 'Despesa atualizada!' : 'Despesa registrada!')
      handleFormClose(true)
      loadTransactions()
    }
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false)
      setEditingTransaction(undefined)
      setFormData({
        description: '',
        transaction_date: new Date(),
        contact_id: '',
        expense_type_id: '',
        amount: '',
      })
    }
  }

  const handleClearFilters = () => {
    setFilterFornecedorId('all')
    setFilterStartDate(undefined)
    setFilterEndDate(undefined)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground">Gerencie todas as despesas registradas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>Filtre as despesas por fornecedor e período</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Combobox
                  options={[
                    { value: 'all', label: 'Todos os fornecedores' },
                    ...fornecedores.map((fornecedor) => ({
                      value: fornecedor.id.toString(),
                      label: fornecedor.name,
                    })),
                  ]}
                  value={filterFornecedorId}
                  onValueChange={setFilterFornecedorId}
                  placeholder="Selecione um fornecedor"
                  searchPlaceholder="Buscar fornecedor..."
                  emptyText="Nenhum fornecedor encontrado."
                />
              </div>

              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>
            Total: {totalCount} despesa(s) | Página {currentPage} de {totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.expense_types?.name || '-'}</TableCell>
                      <TableCell>{transaction.contacts?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(transaction)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Exibindo {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={handleFormClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Editar' : 'Nova'} Despesa</DialogTitle>
            <DialogDescription>Preencha os dados da despesa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.transaction_date && 'text-muted-foreground'
                        )}
                        disabled={isPending}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.transaction_date, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.transaction_date}
                        onSelect={(date) => date && setFormData({ ...formData, transaction_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense_type">Tipo de Despesa *</Label>
                  <Combobox
                    options={tiposDespesa.map((tipo) => ({
                      value: tipo.id.toString(),
                      label: tipo.name,
                    }))}
                    value={formData.expense_type_id}
                    onValueChange={(value) => setFormData({ ...formData, expense_type_id: value })}
                    placeholder="Selecione um tipo de despesa"
                    searchPlaceholder="Buscar tipo..."
                    emptyText="Nenhum tipo encontrado."
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
                  <Combobox
                    options={[
                      { value: 'none', label: 'Nenhum' },
                      ...fornecedores.map((fornecedor) => ({
                        value: fornecedor.id.toString(),
                        label: fornecedor.name,
                      })),
                    ]}
                    value={formData.contact_id}
                    onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                    placeholder="Selecione um fornecedor"
                    searchPlaceholder="Buscar fornecedor..."
                    emptyText="Nenhum fornecedor encontrado."
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    disabled={isPending}
                  />
                </div>
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

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
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
