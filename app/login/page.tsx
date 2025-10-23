'use client'

import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
        toast.error('Erro ao fazer login', {
          description: result.error,
        })
      }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-12">
            <Image
              src="/logo.png"
              alt="ZoboliControl"
              width={400}
              height={120}
              className="h-auto w-full max-w-md"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            Bem-vindo ao ZoboliControl
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed text-center">
            Sistema completo de gestão para empresas de insumos agrícolas.
            Controle vendas, compras, despesas e muito mais.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-slate-400 text-sm text-center">
            © 2025 ZoboliControl - Sistema de Controle Gerencial
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Logo para mobile */}
          <div className="lg:hidden flex justify-center mb-12">
            <Image
              src="/logo.png"
              alt="ZoboliControl"
              width={640}
              height={192}
              className="h-auto w-full max-w-lg px-2"
              priority
            />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <h2 className="text-2xl font-bold text-center">Acesse sua conta</h2>
              <CardDescription className="text-center">
                Digite suas credenciais para entrar no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={isPending}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isPending}
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isPending}
                >
                  {isPending ? 'Entrando...' : 'Entrar no Sistema'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            Sistema de Controle Gerencial
          </p>
        </div>
      </div>
    </div>
  )
}
