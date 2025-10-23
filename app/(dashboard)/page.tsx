import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getDashboardMetrics, getExpensesByCategory, getTransactions } from '@/app/actions/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardChart } from '@/components/dashboard-chart'
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Buscar métricas dos últimos 30 dias
  const metrics = await getDashboardMetrics(30)

  // Buscar despesas por categoria do mês atual
  const expensesByCategory = await getExpensesByCategory()

  // Buscar últimas 10 transações
  const recentTransactions = await getTransactions()
  const last10Transactions = recentTransactions.slice(0, 10)

  const typeLabels = {
    entrada: 'Compra',
    saida: 'Venda',
    despesa: 'Despesa',
  }

  const typeColors = {
    entrada: 'text-blue-600',
    saida: 'text-green-600',
    despesa: 'text-red-600',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao ZoboliControl, {user?.email}
        </p>
      </div>

      {/* Métricas Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas (Compras)</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas (Vendas)</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <TrendingUpIcon className={`h-4 w-4 ${metrics.fluxoCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.fluxoCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.fluxoCaixa)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas - Compras - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Despesas */}
      {expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Despesas do mês atual agrupadas por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart data={expensesByCategory} />
          </CardContent>
        </Card>
      )}

      {/* Últimas Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
          <CardDescription>As 10 transações mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          {last10Transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação registrada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {last10Transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span className={typeColors[transaction.type]}>
                        {typeLabels[transaction.type]}
                      </span>
                      {transaction.contacts && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate max-w-[150px]">{transaction.contacts.name}</span>
                        </>
                      )}
                      {transaction.products && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate max-w-[150px]">{transaction.products.name}</span>
                        </>
                      )}
                      {transaction.expense_types && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate max-w-[120px]">{transaction.expense_types.name}</span>
                        </>
                      )}
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs">{formatDate(transaction.transaction_date)}</span>
                    </div>
                  </div>
                  <div className={`font-bold text-lg sm:text-xl whitespace-nowrap ${typeColors[transaction.type]}`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
