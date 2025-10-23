'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCashFlow } from '@/app/actions/financial'
import { Badge } from '@/components/ui/badge'

type CashFlowEntry = {
  id: string
  date: string
  type: 'entrada' | 'saida' | 'despesa' | 'pagamento' | 'recebimento'
  description: string
  amount: number
  balance?: number
  contact?: string
  category?: string
}

export default function FluxoCaixaPage() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [summary, setSummary] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    totalDespesas: 0,
    saldo: 0,
  })

  const loadCashFlow = useCallback(async () => {
    setLoading(true)

    // Parse selected month to get start and end dates
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of month

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const { transactions, payments } = await getCashFlow(startStr, endStr)

    // Consolidate all entries
    const consolidated: CashFlowEntry[] = []

    // Add transactions
    transactions.forEach((t: { id: number; transaction_date: string; type: 'entrada' | 'saida' | 'despesa'; description: string; amount: string }) => {
      consolidated.push({
        id: `transaction-${t.id}`,
        date: t.transaction_date,
        type: t.type,
        description: t.description || `Transação ${t.type}`,
        amount: parseFloat(t.amount),
        category: t.type,
      })
    })

    // Add payments from payment_history
    payments.forEach((p: { id: number; payment_date: string; amount: string; financial_accounts?: { type: string; description: string; contacts?: { name: string } } }) => {
      const isReceber = p.financial_accounts?.type === 'receber'
      consolidated.push({
        id: `payment-${p.id}`,
        date: p.payment_date,
        type: isReceber ? 'recebimento' : 'pagamento',
        description: p.financial_accounts?.description || 'Pagamento',
        amount: parseFloat(p.amount),
        contact: p.financial_accounts?.contacts?.name,
      })
    })

    // Sort by date
    consolidated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate running balance
    // ATENÇÃO: No banco, 'entrada' = compra (saída de $) e 'saida' = venda (entrada de $)
    let runningBalance = 0
    const entriesWithBalance = consolidated.map(entry => {
      if (entry.type === 'saida' || entry.type === 'recebimento') {
        // 'saida' no banco = VENDA = entrada de dinheiro no caixa
        runningBalance += entry.amount
      } else if (entry.type === 'entrada' || entry.type === 'pagamento' || entry.type === 'despesa') {
        // 'entrada' no banco = COMPRA = saída de dinheiro do caixa
        runningBalance -= entry.amount
      }
      return { ...entry, balance: runningBalance }
    })

    setEntries(entriesWithBalance)

    // Calculate summary
    // ATENÇÃO: No banco, 'entrada' = compra (saída de $) e 'saida' = venda (entrada de $)
    const totalEntradas = consolidated
      .filter(e => e.type === 'saida' || e.type === 'recebimento') // 'saida' = venda = entrada $
      .reduce((sum, e) => sum + e.amount, 0)

    const totalSaidas = consolidated
      .filter(e => e.type === 'entrada' || e.type === 'pagamento') // 'entrada' = compra = saída $
      .reduce((sum, e) => sum + e.amount, 0)

    const totalDespesas = consolidated
      .filter(e => e.type === 'despesa')
      .reduce((sum, e) => sum + e.amount, 0)

    setSummary({
      totalEntradas,
      totalSaidas,
      totalDespesas,
      saldo: totalEntradas - totalSaidas - totalDespesas,
    })

    setLoading(false)
  }, [selectedMonth])

  useEffect(() => {
    loadCashFlow()
  }, [loadCashFlow])

  // Generate month options (last 12 months + next 3 months)
  const monthOptions = []
  for (let i = -12; i <= 3; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    monthOptions.push({ value: `${year}-${month}`, label })
  }

  const getTypeColor = (type: string) => {
    // ATENÇÃO: No banco, 'entrada' = compra (saída de $) e 'saida' = venda (entrada de $)
    switch (type) {
      case 'saida': // venda = entrada de dinheiro
      case 'recebimento':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'entrada': // compra = saída de dinheiro
      case 'pagamento':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'despesa':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getTypeLabel = (type: string) => {
    // ATENÇÃO: No banco, 'entrada' = compra (saída de $) e 'saida' = venda (entrada de $)
    const labels: Record<string, string> = {
      entrada: 'Compra',
      saida: 'Venda',
      despesa: 'Despesa',
      pagamento: 'Pagamento',
      recebimento: 'Recebimento',
    }
    return labels[type] || type
  }

  const getTypeIcon = (type: string) => {
    // ATENÇÃO: No banco, 'entrada' = compra (saída de $) e 'saida' = venda (entrada de $)
    if (type === 'saida' || type === 'recebimento') {
      return <ArrowUpIcon className="h-4 w-4 text-green-600" />
    } else {
      return <ArrowDownIcon className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Visualização consolidada de todas as movimentações financeiras
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="month-select" className="whitespace-nowrap">
              Mês/Ano:
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select" className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas + Recebimentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Compras + Pagamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Despesas operacionais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.saldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas - Saídas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Consolidadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhuma movimentação encontrada neste período
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Selecione outro período ou registre novas transações
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[140px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Contato/Categoria</TableHead>
                    <TableHead className="text-right w-[120px]">Valor</TableHead>
                    <TableHead className="text-right w-[120px]">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(entry.type)}
                          <Badge variant="outline" className={getTypeColor(entry.type)}>
                            {getTypeLabel(entry.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.contact || entry.category || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        entry.type === 'saida' || entry.type === 'recebimento'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {entry.type === 'saida' || entry.type === 'recebimento' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        (entry.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(entry.balance || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
