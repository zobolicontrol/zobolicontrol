'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

type ChartData = {
  name: string
  amount: number
}

// Paleta de cores vibrantes e distintas
const COLORS = [
  '#10b981', // verde
  '#3b82f6', // azul
  '#f59e0b', // laranja
  '#ef4444', // vermelho
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#06b6d4', // ciano
  '#84cc16', // lima
  '#f97316', // laranja escuro
  '#6366f1', // índigo
]

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{
            color: '#0f172a',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
        />
        <Bar
          dataKey="amount"
          radius={[8, 8, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
