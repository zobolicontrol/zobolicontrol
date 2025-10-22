-- ZoboliControl - Esquema do Banco de Dados
-- Execute este script no SQL Editor do Supabase

-- =============================================
-- 1. TABELA: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários autenticados podem ver profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir seu próprio profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================
-- 2. TABELA: contacts (Clientes e Fornecedores)
-- =============================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cliente', 'fornecedor')),
  phone TEXT,
  document TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contacts
CREATE POLICY "Usuários autenticados podem ver contacts"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir contacts"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contacts"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar contacts"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 3. TABELA: products
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('tonelada', 'kg', 'fardo', 'unidade')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products
CREATE POLICY "Usuários autenticados podem ver products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 4. TABELA: expense_types
-- =============================================
CREATE TABLE IF NOT EXISTS public.expense_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expense_types
CREATE POLICY "Usuários autenticados podem ver expense_types"
  ON public.expense_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir expense_types"
  ON public.expense_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar expense_types"
  ON public.expense_types FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar expense_types"
  ON public.expense_types FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 5. TABELA: transactions (Livro-Razão)
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'despesa')),
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  quantity NUMERIC(10, 2),
  unit_price NUMERIC(10, 2),
  amount NUMERIC(10, 2) NOT NULL,
  contact_id BIGINT REFERENCES public.contacts(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  expense_type_id BIGINT REFERENCES public.expense_types(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para transactions
CREATE POLICY "Usuários autenticados podem ver transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 6. ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX idx_contacts_type ON public.contacts(type);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);

-- =============================================
-- 7. FUNÇÃO PARA ATUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_types_updated_at BEFORE UPDATE ON public.expense_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- =============================================
-- Inserir alguns tipos de despesa padrão
INSERT INTO public.expense_types (name) VALUES
  ('Combustível'),
  ('Manutenção'),
  ('Salários'),
  ('Aluguel'),
  ('Impostos'),
  ('Outros')
ON CONFLICT DO NOTHING;
