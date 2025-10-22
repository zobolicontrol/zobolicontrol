'use client'

import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { createTransaction } from '@/app/actions/transactions'
import { getContacts, type Contact } from '@/app/actions/contacts'
import { getProducts, type Product } from '@/app/actions/products'
import { getExpenseTypes, type ExpenseType } from '@/app/actions/expense-types'

export default function LancamentosPage() {
  const [activeTab, setActiveTab] = useState<'saida' | 'entrada' | 'despesa'>('saida')
  const [isPending, setIsPending] = useState(false)

  // Listas para selects
  const [clientes, setClientes] = useState<Contact[]>([])
  const [fornecedores, setFornecedores] = useState<Contact[]>([])
  const [produtos, setProdutos] = useState<Product[]>([])
  const [tiposDespesa, setTiposDespesa] = useState<ExpenseType[]>([])

  // Form data para Entrada/Saída
  const [formMovimento, setFormMovimento] = useState({
    description: '',
    transaction_date: new Date(),
    contact_id: '',
    product_id: '',
    quantity: '',
    unit_price: '',
  })

  // Form data para Despesa
  const [formDespesa, setFormDespesa] = useState({
    description: '',
    transaction_date: new Date(),
    expense_type_id: '',
    amount: '',
  })

  // Valor total calculado (para Entrada/Saída)
  const [valorTotal, setValorTotal] = useState(0)

  // Carregar dados dos selects
  useEffect(() => {
    const loadData = async () => {
      const [clientesData, fornecedoresData, produtosData, tiposDespesaData] = await Promise.all([
        getContacts('cliente'),
        getContacts('fornecedor'),
        getProducts(),
        getExpenseTypes(),
      ])
      setClientes(clientesData)
      setFornecedores(fornecedoresData)
      setProdutos(produtosData)
      setTiposDespesa(tiposDespesaData)
    }
    loadData()
  }, [])

  // Calcular valor total quando quantidade ou preço mudar
  useEffect(() => {
    const quantity = parseFloat(formMovimento.quantity) || 0
    const unitPrice = parseFloat(formMovimento.unit_price) || 0
    setValorTotal(quantity * unitPrice)
  }, [formMovimento.quantity, formMovimento.unit_price])

  const handleSubmitMovimento = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const result = await createTransaction({
      type: activeTab as 'entrada' | 'saida',
      description: formMovimento.description,
      transaction_date: formMovimento.transaction_date.toISOString(),
      contact_id: parseInt(formMovimento.contact_id),
      product_id: parseInt(formMovimento.product_id),
      quantity: parseFloat(formMovimento.quantity),
      unit_price: parseFloat(formMovimento.unit_price),
      amount: valorTotal,
    })

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao salvar lançamento', {
        description: result.error,
      })
    } else {
      toast.success('Lançamento salvo com sucesso!')
      // Limpar formulário
      setFormMovimento({
        description: '',
        transaction_date: new Date(),
        contact_id: '',
        product_id: '',
        quantity: '',
        unit_price: '',
      })
      setValorTotal(0)
    }
  }

  const handleSubmitDespesa = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const result = await createTransaction({
      type: 'despesa',
      description: formDespesa.description,
      transaction_date: formDespesa.transaction_date.toISOString(),
      expense_type_id: parseInt(formDespesa.expense_type_id),
      amount: parseFloat(formDespesa.amount),
    })

    setIsPending(false)

    if (result.error) {
      toast.error('Erro ao salvar despesa', {
        description: result.error,
      })
    } else {
      toast.success('Despesa salva com sucesso!')
      // Limpar formulário
      setFormDespesa({
        description: '',
        transaction_date: new Date(),
        expense_type_id: '',
        amount: '',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
        <p className="text-muted-foreground">Registre vendas, compras e despesas</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saida' | 'entrada' | 'despesa')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saida">Saída (Venda)</TabsTrigger>
          <TabsTrigger value="entrada">Entrada (Compra)</TabsTrigger>
          <TabsTrigger value="despesa">Despesa</TabsTrigger>
        </TabsList>

        {/* Tab: Saída (Venda) */}
        <TabsContent value="saida">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Venda</CardTitle>
              <CardDescription>
                Registre uma venda de produto para um cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitMovimento} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formMovimento.description}
                      onChange={(e) => setFormMovimento({ ...formMovimento, description: e.target.value })}
                      placeholder="Ex: Venda de palha de arroz"
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
                            !formMovimento.transaction_date && 'text-muted-foreground'
                          )}
                          disabled={isPending}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formMovimento.transaction_date ? (
                            format(formMovimento.transaction_date, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formMovimento.transaction_date}
                          onSelect={(date) => date && setFormMovimento({ ...formMovimento, transaction_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select
                      value={formMovimento.contact_id}
                      onValueChange={(value) => setFormMovimento({ ...formMovimento, contact_id: value })}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Produto *</Label>
                    <Select
                      value={formMovimento.product_id}
                      onValueChange={(value) => setFormMovimento({ ...formMovimento, product_id: value })}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formMovimento.quantity}
                      onChange={(e) => setFormMovimento({ ...formMovimento, quantity: e.target.value })}
                      placeholder="Ex: 2.5"
                      required
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Preço Unitário (R$) *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formMovimento.unit_price}
                      onChange={(e) => setFormMovimento({ ...formMovimento, unit_price: e.target.value })}
                      placeholder="Ex: 150.00"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Valor Total:</span>
                    <span className="text-2xl font-bold">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? 'Salvando...' : 'Salvar Venda'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Entrada (Compra) */}
        <TabsContent value="entrada">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Compra</CardTitle>
              <CardDescription>
                Registre uma compra de produto de um fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitMovimento} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formMovimento.description}
                      onChange={(e) => setFormMovimento({ ...formMovimento, description: e.target.value })}
                      placeholder="Ex: Compra de cama de frango"
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
                            !formMovimento.transaction_date && 'text-muted-foreground'
                          )}
                          disabled={isPending}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formMovimento.transaction_date ? (
                            format(formMovimento.transaction_date, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formMovimento.transaction_date}
                          onSelect={(date) => date && setFormMovimento({ ...formMovimento, transaction_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor *</Label>
                    <Select
                      value={formMovimento.contact_id}
                      onValueChange={(value) => setFormMovimento({ ...formMovimento, contact_id: value })}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                            {fornecedor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Produto *</Label>
                    <Select
                      value={formMovimento.product_id}
                      onValueChange={(value) => setFormMovimento({ ...formMovimento, product_id: value })}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formMovimento.quantity}
                      onChange={(e) => setFormMovimento({ ...formMovimento, quantity: e.target.value })}
                      placeholder="Ex: 2.5"
                      required
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Preço Unitário (R$) *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formMovimento.unit_price}
                      onChange={(e) => setFormMovimento({ ...formMovimento, unit_price: e.target.value })}
                      placeholder="Ex: 150.00"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Valor Total:</span>
                    <span className="text-2xl font-bold">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? 'Salvando...' : 'Salvar Compra'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Despesa */}
        <TabsContent value="despesa">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Despesa</CardTitle>
              <CardDescription>
                Registre uma despesa operacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDespesa} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description-despesa">Descrição *</Label>
                    <Input
                      id="description-despesa"
                      value={formDespesa.description}
                      onChange={(e) => setFormDespesa({ ...formDespesa, description: e.target.value })}
                      placeholder="Ex: Abastecimento do caminhão"
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
                            !formDespesa.transaction_date && 'text-muted-foreground'
                          )}
                          disabled={isPending}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formDespesa.transaction_date ? (
                            format(formDespesa.transaction_date, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formDespesa.transaction_date}
                          onSelect={(date) => date && setFormDespesa({ ...formDespesa, transaction_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense_type">Tipo de Despesa *</Label>
                    <Select
                      value={formDespesa.expense_type_id}
                      onValueChange={(value) => setFormDespesa({ ...formDespesa, expense_type_id: value })}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDespesa.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor Total (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formDespesa.amount}
                      onChange={(e) => setFormDespesa({ ...formDespesa, amount: e.target.value })}
                      placeholder="Ex: 250.00"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? 'Salvando...' : 'Salvar Despesa'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
