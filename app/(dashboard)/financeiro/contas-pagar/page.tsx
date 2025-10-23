'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import { Combobox } from '@/components/ui/combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Plus, MoreVertical, Pencil, Trash2, DollarSign, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getFinancialAccounts,
  createFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount,
  addPayment,
  getFinancialSummary,
  type FinancialAccount,
} from '@/app/actions/financial'
import { getContacts, type Contact } from '@/app/actions/contacts'

export default function ContasPagarPage() {
  const [contas, setContas] = useState<FinancialAccount[]>([])
  const [fornecedores, setFornecedores] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingConta, setEditingConta] = useState<FinancialAccount | undefined>()
  const [contaToDelete, setContaToDelete] = useState<FinancialAccount | null>(null)
  const [selectedConta, setSelectedConta] = useState<FinancialAccount | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterFornecedorId, setFilterFornecedorId] = useState<string>('all')
  const [filterStartDate, setFilterStartDate] = useState<Date>()
  const [filterEndDate, setFilterEndDate] = useState<Date>()
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({ total: 0, pago: 0, pendente: 0, vencido: 0 })

  const [formData, setFormData] = useState({
    description: '',
    contact_id: '',
    due_date: new Date(),
    issue_date: new Date(),
    amount: '',
    notes: '',
  })

  const [paymentData, setPaymentData] = useState({
    payment_date: new Date(),
    amount: '',
    payment_method: '',
    notes: '',
  })

  const loadContas = useCallback(async () => {
    setLoading(true)

    const filters = {
      status: filterStatus !== 'all' ? filterStatus : undefined,
      contactId: filterFornecedorId !== 'all' ? filterFornecedorId : undefined,
      startDate: filterStartDate?.toISOString().split('T')[0],
      endDate: filterEndDate?.toISOString().split('T')[0],
    }

    const data = await getFinancialAccounts('pagar', filters)
    setContas(data)

    const summaryData = await getFinancialSummary()
    setSummary(summaryData.contasPagar)

    setLoading(false)
  }, [filterStatus, filterFornecedorId, filterStartDate, filterEndDate])

  useEffect(() => {
    const loadData = async () => {
      const fornecedoresData = await getContacts('fornecedor')
      setFornecedores(fornecedoresData)
    }
    loadData()
  }, [])

  useEffect(() => {
    loadContas()
  }, [loadContas])

  const handleEdit = (conta: FinancialAccount) => {
    setEditingConta(conta)
    setFormData({
      description: conta.description,
      contact_id: conta.contact_id?.toString() || '',
      due_date: new Date(conta.due_date),
      issue_date: new Date(conta.issue_date),
      amount: conta.amount.toString(),
      notes: conta.notes || '',
    })
    setFormOpen(true)
  }

  const handleDelete = (conta: FinancialAccount) => {
    setContaToDelete(conta)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!contaToDelete) return

    const result = await deleteFinancialAccount(contaToDelete.id)
    if (result.error) {
      toast.error('Erro ao excluir', { description: result.error })
    } else {
      toast.success('Conta excluída com sucesso!')
      loadContas()
    }
    setDeleteDialogOpen(false)
    setContaToDelete(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const data = {
      type: 'pagar' as const,
      description: formData.description,
      contact_id: formData.contact_id ? parseInt(formData.contact_id) : undefined,
      due_date: formData.due_date.toISOString().split('T')[0],
      issue_date: formData.issue_date.toISOString().split('T')[0],
      amount: parseFloat(formData.amount),
      notes: formData.notes,
    }

    let result
    if (editingConta) {
      result = await updateFinancialAccount(editingConta.id, data)
    } else {
      result = await createFinancialAccount(data)
    }

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao salvar', { description: result.error })
    } else {
      toast.success(editingConta ? 'Conta atualizada!' : 'Conta criada!')
      setFormOpen(false)
      setEditingConta(undefined)
      setFormData({
        description: '',
        contact_id: '',
        due_date: new Date(),
        issue_date: new Date(),
        amount: '',
        notes: '',
      })
      loadContas()
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConta) return

    setIsPending(true)

    const result = await addPayment(selectedConta.id, {
      payment_date: paymentData.payment_date.toISOString().split('T')[0],
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.payment_method,
      notes: paymentData.notes,
    })

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao registrar pagamento', { description: result.error })
    } else {
      toast.success('Pagamento registrado com sucesso!')
      setPaymentOpen(false)
      setSelectedConta(null)
      setPaymentData({
        payment_date: new Date(),
        amount: '',
        payment_method: '',
        notes: '',
      })
      loadContas()
    }
  }

  const openPaymentDialog = (conta: FinancialAccount) => {
    setSelectedConta(conta)
    setPaymentData({
      ...paymentData,
      amount: (conta.amount - conta.amount_paid).toString(),
    })
    setPaymentOpen(true)
  }

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    // Adicionar logo no cabeçalho
    try {
      const img = new Image()
      img.src = '/logo.png'
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
      if (img.complete && img.naturalWidth > 0) {
        const imgWidth = 50
        const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth
        const xPos = (doc.internal.pageSize.getWidth() - imgWidth) / 2
        doc.addImage(img, 'PNG', xPos, 10, imgWidth, imgHeight)
      }
    } catch (error) {
      console.error('Erro ao carregar logo no PDF:', error)
    }

    // Título
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Contas a Pagar', doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' })

    // Data de geração
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 40)

    // Filtros aplicados
    let filterText = 'Filtros: '
    if (filterStatus !== 'all') filterText += `Status: ${statusLabels[filterStatus as keyof typeof statusLabels]} • `
    if (filterFornecedorId !== 'all') {
      const fornecedor = fornecedores.find(f => f.id.toString() === filterFornecedorId)
      if (fornecedor) filterText += `Fornecedor: ${fornecedor.name} • `
    }
    if (filterStartDate) filterText += `De: ${format(filterStartDate, 'dd/MM/yyyy', { locale: ptBR })} • `
    if (filterEndDate) filterText += `Até: ${format(filterEndDate, 'dd/MM/yyyy', { locale: ptBR })}`
    if (filterText === 'Filtros: ') filterText += 'Nenhum'

    doc.setFontSize(9)
    doc.text(filterText, 14, 46)

    // Resumo
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Financeiro', 14, 56)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total: ${formatCurrency(summary.total)}`, 14, 63)
    doc.text(`Pago: ${formatCurrency(summary.pago)}`, 70, 63)
    doc.text(`Pendente: ${formatCurrency(summary.pendente)}`, 120, 63)
    doc.text(`Vencido: ${formatCurrency(summary.vencido)}`, 170, 63)

    // Dados da tabela
    const tableData = filteredContas.map(conta => [
      format(new Date(conta.due_date), 'dd/MM/yyyy', { locale: ptBR }),
      conta.description,
      conta.contacts?.name || '-',
      formatCurrency(conta.amount),
      formatCurrency(conta.amount_paid),
      formatCurrency(conta.amount - conta.amount_paid),
      statusLabels[conta.status as keyof typeof statusLabels],
    ])

    autoTable(doc, {
      startY: 72,
      head: [['Vencimento', 'Descrição', 'Fornecedor', 'Valor', 'Pago', 'Saldo', 'Status']],
      body: tableData,
      foot: [[
        { content: 'Totais:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(filteredContas.reduce((sum, c) => sum + c.amount, 0)), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(filteredContas.reduce((sum, c) => sum + c.amount_paid, 0)), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(filteredContas.reduce((sum, c) => sum + (c.amount - c.amount_paid), 0)), styles: { halign: 'right', fontStyle: 'bold' } },
        ''
      ]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [254, 226, 226], textColor: [239, 68, 68], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 20 },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    })

    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    doc.save(`contas_pagar_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`)
    toast.success('PDF exportado com sucesso!')
  }

  const filteredContas = filterStatus === 'all'
    ? contas
    : contas.filter((c) => c.status === filterStatus)

  const statusLabels = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    pago: 'Pago',
    vencido: 'Vencido',
  }

  const statusColors = {
    pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    parcial: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    pago: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    vencido: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie suas contas a pagar</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.pago)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pendente)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(summary.vencido)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Combobox
                  options={[
                    { value: 'all', label: 'Todos' },
                    ...fornecedores.map((forn) => ({
                      value: forn.id.toString(),
                      label: forn.name,
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
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filterEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all')
                  setFilterFornecedorId('all')
                  setFilterStartDate(undefined)
                  setFilterEndDate(undefined)
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exportação */}
      <div className="flex justify-end">
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Pago</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredContas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma conta encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredContas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(conta.due_date)}</TableCell>
                  <TableCell>{conta.description}</TableCell>
                  <TableCell>{conta.contacts?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[conta.status]}`}>
                      {statusLabels[conta.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(conta.amount)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(conta.amount_paid)}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(conta.amount - conta.amount_paid)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {conta.status !== 'pago' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPaymentDialog(conta)}
                          title="Registrar Pagamento"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(conta)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(conta)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open)
        if (!open) {
          setEditingConta(undefined)
          setFormData({
            description: '',
            contact_id: '',
            due_date: new Date(),
            issue_date: new Date(),
            amount: '',
            notes: '',
          })
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingConta ? 'Editar' : 'Nova'} Conta a Pagar</DialogTitle>
            <DialogDescription>Preencha os dados da conta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select
                    value={formData.contact_id}
                    onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((forn) => (
                        <SelectItem key={forn.id} value={forn.id.toString()}>
                          {forn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal')} disabled={isPending}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.issue_date, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.issue_date}
                        onSelect={(date) => date && setFormData({ ...formData, issue_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal')} disabled={isPending}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.due_date, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => date && setFormData({ ...formData, due_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={(open) => {
        setPaymentOpen(open)
        if (!open) {
          setSelectedConta(null)
          setPaymentData({
            payment_date: new Date(),
            amount: '',
            payment_method: '',
            notes: '',
          })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedConta?.description}
              <br />
              <span className="text-sm">Saldo: {formatCurrency((selectedConta?.amount || 0) - (selectedConta?.amount_paid || 0))}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal')} disabled={isPending}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(paymentData.payment_date, 'PPP', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentData.payment_date}
                      onSelect={(date) => date && setPaymentData({ ...paymentData, payment_date: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Registrar Pagamento'}
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
                Tem certeza que deseja excluir a conta &quot;{contaToDelete?.description}&quot;?
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
