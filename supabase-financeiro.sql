-- ZoboliControl - Módulo Financeiro
-- Execute este script no SQL Editor do Supabase (APÓS executar o supabase-schema.sql)

-- =============================================
-- TABELA: financial_accounts (Contas a Pagar/Receber)
-- =============================================
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('pagar', 'receber')),
  description TEXT NOT NULL,
  contact_id BIGINT REFERENCES public.contacts(id) ON DELETE SET NULL,
  transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago', 'vencido')),
  payment_date DATE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_accounts
CREATE POLICY "Usuários autenticados podem ver financial_accounts"
  ON public.financial_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir financial_accounts"
  ON public.financial_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar financial_accounts"
  ON public.financial_accounts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar financial_accounts"
  ON public.financial_accounts FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- TABELA: payment_history (Histórico de Pagamentos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id BIGSERIAL PRIMARY KEY,
  financial_account_id BIGINT REFERENCES public.financial_accounts(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_history
CREATE POLICY "Usuários autenticados podem ver payment_history"
  ON public.payment_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir payment_history"
  ON public.payment_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX idx_financial_accounts_type ON public.financial_accounts(type);
CREATE INDEX idx_financial_accounts_status ON public.financial_accounts(status);
CREATE INDEX idx_financial_accounts_due_date ON public.financial_accounts(due_date);
CREATE INDEX idx_financial_accounts_contact ON public.financial_accounts(contact_id);
CREATE INDEX idx_payment_history_account ON public.payment_history(financial_account_id);

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÃO PARA ATUALIZAR STATUS AUTOMATICAMENTE
-- =============================================
CREATE OR REPLACE FUNCTION update_financial_account_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar status baseado no valor pago
  IF NEW.amount_paid >= NEW.amount THEN
    NEW.status = 'pago';
    IF NEW.payment_date IS NULL THEN
      NEW.payment_date = CURRENT_DATE;
    END IF;
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status = 'parcial';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'vencido';
  ELSE
    NEW.status = 'pendente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status automaticamente
CREATE TRIGGER trigger_update_financial_account_status
  BEFORE INSERT OR UPDATE ON public.financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_account_status();

-- =============================================
-- FUNÇÃO PARA ATUALIZAR amount_paid APÓS PAGAMENTO
-- =============================================
CREATE OR REPLACE FUNCTION update_amount_paid_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total pago na conta financeira
  UPDATE public.financial_accounts
  SET amount_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.payment_history
    WHERE financial_account_id = NEW.financial_account_id
  )
  WHERE id = NEW.financial_account_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar amount_paid após inserir pagamento
CREATE TRIGGER trigger_update_amount_paid
  AFTER INSERT ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_amount_paid_after_payment();

-- =============================================
-- VIEW: Resumo Financeiro
-- =============================================
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT
  type,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  SUM(amount_paid) as total_paid,
  SUM(amount - amount_paid) as total_pending
FROM public.financial_accounts
GROUP BY type, status;

-- =============================================
-- VIEW: Contas Vencidas
-- =============================================
CREATE OR REPLACE VIEW public.overdue_accounts AS
SELECT
  fa.*,
  c.name as contact_name,
  c.phone as contact_phone,
  CURRENT_DATE - fa.due_date as days_overdue
FROM public.financial_accounts fa
LEFT JOIN public.contacts c ON fa.contact_id = c.id
WHERE fa.status IN ('pendente', 'parcial', 'vencido')
  AND fa.due_date < CURRENT_DATE
ORDER BY fa.due_date ASC;

-- =============================================
-- DADOS DE TESTE (OPCIONAL)
-- =============================================
-- Você pode descomentar abaixo para inserir dados de exemplo
/*
-- Inserir uma conta a receber de exemplo
INSERT INTO public.financial_accounts
  (type, description, contact_id, due_date, amount, user_id)
VALUES
  ('receber', 'Venda de Palha de Arroz - Fatura #001', 1, CURRENT_DATE + INTERVAL '30 days', 1500.00, auth.uid());

-- Inserir uma conta a pagar de exemplo
INSERT INTO public.financial_accounts
  (type, description, contact_id, due_date, amount, user_id)
VALUES
  ('pagar', 'Compra de Insumos - NF #123', 2, CURRENT_DATE + INTERVAL '15 days', 800.00, auth.uid());
*/
