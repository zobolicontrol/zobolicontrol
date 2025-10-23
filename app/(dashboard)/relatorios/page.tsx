'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Combobox } from '@/components/ui/combobox'
import { getTransactionsByDateRange, type Transaction } from '@/app/actions/transactions'
import { getContacts, type Contact } from '@/app/actions/contacts'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, TrendingUpIcon, Download, BarChart3, Calendar as CalendarIcon } from 'lucide-react'

export default function RelatoriosPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [filterContactId, setFilterContactId] = useState<string>('all')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [compareType, setCompareType] = useState<'month' | 'year'>('month')
  const [compareData, setCompareData] = useState<{month: string; year: string; data: Transaction[];}[]>([])
  const [activeTab, setActiveTab] = useState<'current' | 'comparative'>('current')
  const [periodType, setPeriodType] = useState<'monthly' | 'custom'>('monthly')
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  const loadTransactions = useCallback(async () => {
    setLoading(true)

    let startDate: string
    let endDate: string

    if (periodType === 'monthly') {
      const month = parseInt(selectedMonth)
      const year = parseInt(selectedYear)
      startDate = new Date(year, month - 1, 1).toISOString()
      endDate = new Date(year, month, 0, 23, 59, 59).toISOString()
    } else {
      // Período customizado
      if (!customStartDate || !customEndDate) {
        setLoading(false)
        return
      }
      startDate = new Date(customStartDate.setHours(0, 0, 0, 0)).toISOString()
      endDate = new Date(customEndDate.setHours(23, 59, 59, 999)).toISOString()
    }

    const data = await getTransactionsByDateRange(startDate, endDate)
    setTransactions(data)
    setLoading(false)
  }, [selectedMonth, selectedYear, periodType, customStartDate, customEndDate])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    const loadContacts = async () => {
      const [clientes, fornecedores] = await Promise.all([
        getContacts('cliente'),
        getContacts('fornecedor'),
      ])
      setContacts([...clientes, ...fornecedores])
    }
    loadContacts()
  }, [])

  const loadComparativeData = useCallback(async () => {
    if (compareType === 'month') {
      // Comparar últimos 6 meses
      const data = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1 - i, 1)
        const month = (date.getMonth() + 1).toString()
        const year = date.getFullYear().toString()
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
        const transactions = await getTransactionsByDateRange(startDate, endDate)
        data.push({ month, year, data: transactions })
      }
      setCompareData(data)
    } else {
      // Comparar últimos 3 anos para o mesmo mês
      const data = []
      for (let i = 2; i >= 0; i--) {
        const year = (parseInt(selectedYear) - i).toString()
        const startDate = new Date(parseInt(year), parseInt(selectedMonth) - 1, 1).toISOString()
        const endDate = new Date(parseInt(year), parseInt(selectedMonth), 0, 23, 59, 59).toISOString()
        const transactions = await getTransactionsByDateRange(startDate, endDate)
        data.push({ month: selectedMonth, year, data: transactions })
      }
      setCompareData(data)
    }
  }, [compareType, selectedMonth, selectedYear])

  useEffect(() => {
    if (activeTab === 'comparative') {
      loadComparativeData()
    }
  }, [activeTab, loadComparativeData])

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Contato', 'Produto/Categoria', 'Valor']
    const rows = filteredTransactions.map(t => [
      formatDateTime(t.transaction_date),
      typeLabels[t.type],
      t.description,
      t.contacts?.name || '-',
      t.products?.name || t.expense_types?.name || '-',
      t.amount.toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_${selectedMonth}_${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório Financeiro - ZoboliControl', 14, 20)

    // Informações do Período
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    let periodText = ''
    if (periodType === 'monthly') {
      const monthName = months.find(m => m.value === selectedMonth)?.label
      periodText = `Período: ${monthName}/${selectedYear}`
    } else if (customStartDate && customEndDate) {
      periodText = `Período: ${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`
    }
    doc.text(periodText, 14, 28)
    doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 34)

    // Resumo Financeiro
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Financeiro', 14, 44)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const summaryY = 52
    doc.text(`Total Vendas: ${formatCurrency(totalSaidas)}`, 14, summaryY)
    doc.text(`Total Compras: ${formatCurrency(totalEntradas)}`, 14, summaryY + 6)
    doc.text(`Total Despesas: ${formatCurrency(totalDespesas)}`, 14, summaryY + 12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Fluxo de Caixa: ${formatCurrency(fluxoCaixa)}`, 14, summaryY + 18)

    let currentY = summaryY + 30

    // Seção de Vendas
    const vendas = filteredTransactions.filter(t => t.type === 'saida')
    if (vendas.length > 0) {
      const totalVendas = vendas.reduce((sum, t) => sum + t.amount, 0)
      const totalQtdVendas = vendas.reduce((sum, t) => sum + (t.quantity || 0), 0)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(16, 185, 129)
      doc.text(`Vendas (${vendas.length} itens - ${totalQtdVendas} unidades - Total: ${formatCurrency(totalVendas)})`, 14, currentY)
      doc.setTextColor(0, 0, 0)

      const vendasData = vendas.map(t => [
        format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR }),
        t.description,
        t.contacts?.name || '-',
        t.products?.name || '-',
        (t.quantity || 0).toString(),
        formatCurrency(t.amount),
      ])

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Data', 'Descrição', 'Cliente', 'Produto', 'Qtd', 'Valor']],
        body: vendasData,
        foot: [[{ content: `Subtotal:`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [220, 252, 231] } }, { content: totalQtdVendas.toString(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [220, 252, 231] } }, { content: formatCurrency(totalVendas), styles: { halign: 'right', fontStyle: 'bold', fillColor: [220, 252, 231] } }]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [220, 252, 231], textColor: [16, 185, 129], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 10
    }

    // Seção de Compras
    const compras = filteredTransactions.filter(t => t.type === 'entrada')
    if (compras.length > 0) {
      const totalCompras = compras.reduce((sum, t) => sum + t.amount, 0)
      const totalQtdCompras = compras.reduce((sum, t) => sum + (t.quantity || 0), 0)

      // Adicionar nova página se necessário
      if (currentY > 220) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text(`Compras (${compras.length} itens - ${totalQtdCompras} unidades - Total: ${formatCurrency(totalCompras)})`, 14, currentY)
      doc.setTextColor(0, 0, 0)

      const comprasData = compras.map(t => [
        format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR }),
        t.description,
        t.contacts?.name || '-',
        t.products?.name || '-',
        (t.quantity || 0).toString(),
        formatCurrency(t.amount),
      ])

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Data', 'Descrição', 'Fornecedor', 'Produto', 'Qtd', 'Valor']],
        body: comprasData,
        foot: [[{ content: `Subtotal:`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } }, { content: totalQtdCompras.toString(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } }, { content: formatCurrency(totalCompras), styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } }]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [219, 234, 254], textColor: [59, 130, 246], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 10
    }

    // Seção de Despesas
    const despesas = filteredTransactions.filter(t => t.type === 'despesa')
    if (despesas.length > 0) {
      const totalDespesasSection = despesas.reduce((sum, t) => sum + t.amount, 0)

      // Adicionar nova página se necessário
      if (currentY > 220) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68)
      doc.text(`Despesas (${despesas.length} itens - Total: ${formatCurrency(totalDespesasSection)})`, 14, currentY)
      doc.setTextColor(0, 0, 0)

      const despesasData = despesas.map(t => [
        format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR }),
        t.description,
        t.contacts?.name || '-',
        t.expense_types?.name || '-',
        formatCurrency(t.amount),
      ])

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Data', 'Descrição', 'Fornecedor', 'Categoria', 'Valor']],
        body: despesasData,
        foot: [[{ content: `Subtotal: ${formatCurrency(totalDespesasSection)}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [254, 226, 226] } }]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [254, 226, 226], textColor: [239, 68, 68], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 50 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      })
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Salvar
    const fileName = periodType === 'monthly'
      ? `relatorio_${selectedMonth}_${selectedYear}.pdf`
      : `relatorio_${format(customStartDate!, 'ddMMyyyy')}_${format(customEndDate!, 'ddMMyyyy')}.pdf`
    doc.save(fileName)
  }

  let filteredTransactions = transactions

  if (filterContactId !== 'all') {
    filteredTransactions = filteredTransactions.filter((t) => t.contact_id?.toString() === filterContactId)
  }

  const totalEntradas = transactions
    .filter((t) => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSaidas = transactions
    .filter((t) => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0)

  const fluxoCaixa = totalSaidas - totalEntradas - totalDespesas

  const typeLabels = {
    entrada: 'Compra',
    saida: 'Venda',
    despesa: 'Despesa',
  }

  const calculatePeriodTotals = (transactions: Transaction[]) => {
    const entradas = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0)
    const saidas = transactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0)
    const despesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0)
    const fluxo = saidas - entradas - despesas
    return { entradas, saidas, despesas, fluxo }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Visualize relatórios financeiros por período</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'comparative')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="current">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Período Atual
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <BarChart3 className="mr-2 h-4 w-4" />
            Comparativo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Período</CardTitle>
              <CardDescription>Escolha entre um mês específico ou um período customizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Período */}
              <div className="space-y-2">
                <Label>Tipo de Período</Label>
                <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'monthly' | 'custom')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="custom">Período Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros Mensais */}
              {periodType === 'monthly' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Filtros Customizados */}
              {periodType === 'custom' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !customStartDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customStartDate ? format(customStartDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
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
                            !customEndDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customEndDate ? format(customEndDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Filtro de Contato */}
              <div className="space-y-2">
                <Label>Contato (Opcional)</Label>
                <Combobox
                  options={[
                    { value: 'all', label: 'Todos' },
                    ...contacts.map((contact) => ({
                      value: contact.id.toString(),
                      label: `${contact.name} (${contact.type === 'cliente' ? 'Cliente' : 'Fornecedor'})`,
                    })),
                  ]}
                  value={filterContactId}
                  onValueChange={setFilterContactId}
                  placeholder="Selecione um contato"
                  searchPlaceholder="Buscar contato..."
                  emptyText="Nenhum contato encontrado."
                />
              </div>
            </CardContent>
          </Card>

      {/* Resumo do Período */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground">Compras no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground">Vendas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">Despesas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <TrendingUpIcon className={`h-4 w-4 ${fluxoCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fluxoCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(fluxoCaixa)}
            </div>
            <p className="text-xs text-muted-foreground">Vendas - Compras - Despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Exportação */}
      <div className="flex justify-end gap-2">
        <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar </span>CSV
        </Button>
        <Button onClick={exportToPDF} variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar </span>PDF
        </Button>
      </div>

      {/* Seções de Transações por Tipo */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            Carregando...
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Nenhuma transação encontrada neste período
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Seção de Vendas */}
          {(() => {
            const vendas = filteredTransactions.filter(t => t.type === 'saida')
            const totalVendas = vendas.reduce((sum, t) => sum + t.amount, 0)
            const totalQuantidadeVendas = vendas.reduce((sum, t) => sum + (t.quantity || 0), 0)
            if (vendas.length === 0) return null

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <ArrowUpIcon className="h-5 w-5" />
                        Vendas
                      </CardTitle>
                      <CardDescription>
                        {vendas.length} transação(ões) • {totalQuantidadeVendas} unidades • Total: {formatCurrency(totalVendas)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Data</TableHead>
                          <TableHead className="min-w-[150px]">Descrição</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Cliente</TableHead>
                          <TableHead className="min-w-[120px] hidden md:table-cell">Produto</TableHead>
                          <TableHead className="text-right min-w-[80px]">Qtd</TableHead>
                          <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendas.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs sm:text-sm">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                              {transaction.contacts?.name || '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              {transaction.products?.name || '-'}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {transaction.quantity || 0}
                            </TableCell>
                            <TableCell className="text-right font-medium whitespace-nowrap text-sm sm:text-base text-green-600">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-50 dark:bg-green-950 font-bold">
                          <TableCell colSpan={4} className="text-right">
                            Subtotal de Vendas ({vendas.length} itens):
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-bold text-sm">
                            {totalQuantidadeVendas}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-bold text-base">
                            {formatCurrency(totalVendas)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Seção de Compras */}
          {(() => {
            const compras = filteredTransactions.filter(t => t.type === 'entrada')
            const totalCompras = compras.reduce((sum, t) => sum + t.amount, 0)
            const totalQuantidadeCompras = compras.reduce((sum, t) => sum + (t.quantity || 0), 0)
            if (compras.length === 0) return null

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-600 flex items-center gap-2">
                        <ArrowDownIcon className="h-5 w-5" />
                        Compras
                      </CardTitle>
                      <CardDescription>
                        {compras.length} transação(ões) • {totalQuantidadeCompras} unidades • Total: {formatCurrency(totalCompras)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Data</TableHead>
                          <TableHead className="min-w-[150px]">Descrição</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Fornecedor</TableHead>
                          <TableHead className="min-w-[120px] hidden md:table-cell">Produto</TableHead>
                          <TableHead className="text-right min-w-[80px]">Qtd</TableHead>
                          <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compras.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs sm:text-sm">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                              {transaction.contacts?.name || '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              {transaction.products?.name || '-'}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                              {transaction.quantity || 0}
                            </TableCell>
                            <TableCell className="text-right font-medium whitespace-nowrap text-sm sm:text-base text-blue-600">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 dark:bg-blue-950 font-bold">
                          <TableCell colSpan={4} className="text-right">
                            Subtotal de Compras ({compras.length} itens):
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-bold text-sm">
                            {totalQuantidadeCompras}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-bold text-base">
                            {formatCurrency(totalCompras)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Seção de Despesas */}
          {(() => {
            const despesas = filteredTransactions.filter(t => t.type === 'despesa')
            const totalDespesasSection = despesas.reduce((sum, t) => sum + t.amount, 0)
            if (despesas.length === 0) return null

            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <DollarSignIcon className="h-5 w-5" />
                        Despesas
                      </CardTitle>
                      <CardDescription>
                        {despesas.length} transação(ões) • Total: {formatCurrency(totalDespesasSection)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Data</TableHead>
                          <TableHead className="min-w-[150px]">Descrição</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Fornecedor</TableHead>
                          <TableHead className="min-w-[120px] hidden md:table-cell">Categoria</TableHead>
                          <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {despesas.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs sm:text-sm">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                              {transaction.contacts?.name || '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              {transaction.expense_types?.name || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium whitespace-nowrap text-sm sm:text-base text-red-600">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-red-50 dark:bg-red-950 font-bold">
                          <TableCell colSpan={4} className="text-right">
                            Subtotal de Despesas ({despesas.length} itens):
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-bold text-base">
                            {formatCurrency(totalDespesasSection)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </>
      )}
        </TabsContent>

        <TabsContent value="comparative" className="space-y-6">
          {/* Filtros Comparativos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Comparação</CardTitle>
              <CardDescription>Escolha como deseja comparar os dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Modo de Comparação</Label>
                <Select value={compareType} onValueChange={(v) => setCompareType(v as 'month' | 'year')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Últimos 6 Meses</SelectItem>
                    <SelectItem value="year">Mesmo Mês - 3 Anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Comparativa */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Financeiro</CardTitle>
              <CardDescription>
                {compareType === 'month' ? 'Evolução dos últimos 6 meses' : `Comparação anual de ${months.find(m => m.value === selectedMonth)?.label}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Saídas</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Fluxo de Caixa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compareData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Carregando dados comparativos...
                        </TableCell>
                      </TableRow>
                    ) : (
                      compareData.map((period, index) => {
                        const totals = calculatePeriodTotals(period.data)
                        const monthName = months.find(m => m.value === period.month)?.label || period.month
                        const periodLabel = compareType === 'month'
                          ? `${monthName}/${period.year}`
                          : `${monthName} ${period.year}`

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{periodLabel}</TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatCurrency(totals.entradas)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(totals.saidas)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(totals.despesas)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${totals.fluxo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(totals.fluxo)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
