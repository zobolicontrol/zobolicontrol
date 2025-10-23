'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard,
  FileText,
  Users,
  Truck,
  Package,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  Wallet,
  CreditCard,
  TrendingUp,
  ChevronDown,
  ShoppingCart,
  ShoppingBag,
  Receipt,
} from 'lucide-react'
import { useState } from 'react'

type NavigationItem = {
  name: string
  href?: string
  icon: React.ElementType
  children?: {
    name: string
    href: string
    icon: React.ElementType
  }[]
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Lançamentos',
    icon: FileText,
    children: [
      {
        name: 'Novo Lançamento',
        href: '/lancamentos',
        icon: FileText,
      },
      {
        name: 'Vendas',
        href: '/lancamentos/vendas',
        icon: ShoppingCart,
      },
      {
        name: 'Compras',
        href: '/lancamentos/compras',
        icon: ShoppingBag,
      },
      {
        name: 'Despesas',
        href: '/lancamentos/despesas',
        icon: Receipt,
      },
    ],
  },
  {
    name: 'Financeiro',
    icon: DollarSign,
    children: [
      {
        name: 'Contas a Pagar',
        href: '/financeiro/contas-pagar',
        icon: CreditCard,
      },
      {
        name: 'Contas a Receber',
        href: '/financeiro/contas-receber',
        icon: Wallet,
      },
      {
        name: 'Fluxo de Caixa',
        href: '/financeiro/fluxo-caixa',
        icon: TrendingUp,
      },
    ],
  },
  {
    name: 'Cadastros',
    icon: Package,
    children: [
      {
        name: 'Clientes',
        href: '/cadastros/clientes',
        icon: Users,
      },
      {
        name: 'Fornecedores',
        href: '/cadastros/fornecedores',
        icon: Truck,
      },
      {
        name: 'Produtos',
        href: '/cadastros/produtos',
        icon: Package,
      },
      {
        name: 'Tipos de Despesa',
        href: '/cadastros/despesas',
        icon: DollarSign,
      },
    ],
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
]

function NavItem({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if current path matches any children
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
    }
    return false
  })

  // If no children, render simple link
  if (!item.children) {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href!}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  // Render collapsible menu
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          {item.name}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children.map((child) => {
            const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
            return (
              <Link
                key={child.name}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b px-4 py-3">
        <Image
          src="/logo.png"
          alt="ZoboliControl"
          width={200}
          height={60}
          className="h-auto w-full max-w-[200px]"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="border-t p-4">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </form>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r bg-background">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
