# ZoboliControl

Sistema de gestão completo para empresas de insumos agrícolas.

## 📋 Sobre o Projeto

ZoboliControl é um Mini-ERP single-tenant desenvolvido para gerenciar vendas, compras e despesas de empresas que trabalham com insumos agrícolas como palha de arroz e cama de frango.

## ✨ Funcionalidades

### Gestão Completa
- 📊 **Dashboard** com métricas financeiras em tempo real
- 💰 **Lançamentos** de vendas, compras e despesas
- 📈 **Relatórios** financeiros por período
- 🔐 **Autenticação** segura via Supabase

### Cadastros (CRUDs)
- 👥 **Clientes** - Gerencie seus clientes
- 🚚 **Fornecedores** - Cadastre seus fornecedores
- 📦 **Produtos** - Controle produtos com diferentes unidades (tonelada, kg, fardo, unidade)
- 💸 **Tipos de Despesa** - Categorize suas despesas

### Cálculo Automático
- O sistema calcula automaticamente o valor total das transações (Quantidade × Preço Unitário)
- Fluxo de caixa calculado em tempo real (Vendas - Compras - Despesas)
- Gráficos de despesas por categoria

## 🚀 Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **UI:** Tailwind CSS + Shadcn/UI
- **Gráficos:** Recharts
- **Formulários:** React Hook Form + Zod
- **PWA:** next-pwa
- **Deploy:** Vercel

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase
- Conta no Vercel (para deploy)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/zobolicontrol.git
cd zobolicontrol
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. **Execute o schema SQL no Supabase**

Abra o arquivo `supabase-schema.sql` e execute todo o conteúdo no SQL Editor do Supabase.

5. **Crie um usuário no Supabase**

No painel do Supabase:
- Vá em **Authentication** > **Users**
- Clique em **Add user** > **Create new user**
- Marque **Auto Confirm User**

6. **Rode o projeto**
```bash
npm run dev
```

Acesse: http://localhost:3000

## 📚 Documentação

### Estrutura do Projeto
```
zobolicontrol/
├── app/
│   ├── (dashboard)/           # Páginas protegidas
│   │   ├── page.tsx           # Dashboard
│   │   ├── lancamentos/       # Página de lançamentos
│   │   ├── relatorios/        # Relatórios
│   │   └── cadastros/         # CRUDs
│   ├── actions/               # Server Actions
│   ├── login/                 # Página de login
│   └── layout.tsx             # Layout raiz
├── components/                # Componentes React
│   ├── ui/                    # Componentes Shadcn/UI
│   └── ...
├── lib/
│   ├── supabase/              # Clientes Supabase
│   └── utils.ts               # Funções utilitárias
└── middleware.ts              # Middleware de autenticação
```

### Guias Disponíveis

1. **[FASE-1-COMPLETA.md](FASE-1-COMPLETA.md)** - Configuração inicial e banco de dados
2. **[FASE-2-3-COMPLETA.md](FASE-2-3-COMPLETA.md)** - Autenticação e CRUDs
3. **[FASE-4-5-COMPLETA.md](FASE-4-5-COMPLETA.md)** - Lançamentos e Relatórios
4. **[GUIA-FINAL-PWA-DEPLOY.md](GUIA-FINAL-PWA-DEPLOY.md)** - PWA e Deploy

## 🎯 Como Usar

### 1. Cadastros Iniciais
Antes de fazer lançamentos, cadastre:
1. Clientes (menu **Clientes**)
2. Fornecedores (menu **Fornecedores**)
3. Produtos (menu **Produtos**)

### 2. Fazer Lançamentos
1. Acesse **Lançamentos**
2. Escolha a aba:
   - **Saída (Venda):** Vender produto para cliente
   - **Entrada (Compra):** Comprar produto de fornecedor
   - **Despesa:** Registrar despesa operacional
3. Preencha os campos
4. O sistema calcula automaticamente o valor total
5. Salve

### 3. Visualizar Dashboard
- Métricas dos últimos 30 dias
- Gráfico de despesas por categoria
- Últimas transações

### 4. Gerar Relatórios
1. Acesse **Relatórios**
2. Selecione mês e ano
3. Veja o resumo e a tabela detalhada

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) habilitado
- Middleware protegendo rotas
- Variáveis de ambiente para credenciais

## 📱 PWA

O sistema pode ser instalado como aplicativo:
- Chrome/Edge: Menu > Instalar ZoboliControl
- Safari (iOS): Compartilhar > Adicionar à Tela Inicial

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push para o GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy!

Veja o guia completo em [GUIA-FINAL-PWA-DEPLOY.md](GUIA-FINAL-PWA-DEPLOY.md)

## 🧪 Scripts

```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm start         # Rodar build de produção
npm run lint      # Verificar erros
```

## 📊 Banco de Dados

### Tabelas:
- `profiles` - Perfis de usuário
- `contacts` - Clientes e fornecedores
- `products` - Produtos
- `expense_types` - Categorias de despesa
- `transactions` - Livro-razão (todas as transações)

### RLS Habilitado:
Todas as tabelas têm Row Level Security configurado.

## 🤝 Contribuindo

Este é um projeto privado/single-tenant. Para sugestões:
1. Abra uma issue
2. Descreva a melhoria/bug
3. Aguarde resposta

## 📄 Licença

Projeto privado - Todos os direitos reservados.

## 📞 Suporte

Para dúvidas sobre o sistema:
- Consulte os arquivos de documentação na raiz do projeto
- Acesse a documentação oficial das tecnologias utilizadas

---

**ZoboliControl** - Sistema de Gestão para Insumos Agrícolas 🌾

Desenvolvido com ❤️ usando Next.js, Supabase e Shadcn/UI
