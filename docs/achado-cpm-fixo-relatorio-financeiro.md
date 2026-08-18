# DOOHPLAY — Achado: CPM fixo em relatório e fechamento financeiro

> Papel: revisão de conteúdo/produto (não é revisão de engenharia de dados
> nem auditoria contábil formal). Achado durante revisão de conteúdo do
> dashboard interno em 17/08/2026. Registrado aqui em vez de corrigido no
> código porque decidir o que fazer exige contexto de negócio que não
> tenho (se `monthly_financial_snapshots` alimenta contabilidade real).

## O que foi encontrado

Dois pontos do código calculam receita de campanha usando um **CPM fixo
de R$ 25,00**, hardcoded direto na query SQL, aplicado igualmente a
qualquer campanha, independente do CPM real cobrado dela:

1. `app/dashboard/reports/campaigns/page.tsx` (linha ~86) — relatório
   interno "Relatório de Campanhas", mostra "Valor (R$)" por campanha e
   um KPI de total.
2. `app/api/finance/close-month/route.ts` (linha ~58) — endpoint real de
   **fechamento de mês**, protegido por `requireSuperAdmin`. Ao ser
   chamado, ele **grava permanentemente** um snapshot em
   `monthly_financial_snapshots` com esse valor fabricado — não é só
   exibição de tela, é persistência de dado financeiro "fechado".

Ambos usam a mesma fórmula:

```sql
25.00::numeric AS cpm,
ROUND((COUNT(pl.id) / 1000.0) * 25.00, 2) AS gross_amount
```

## Por que não é só "esqueceram de conectar o valor real"

A tabela `public.campaigns` (minúscula — existe uma tabela `"Campaign"`
capitalizada separada, usada pelo fluxo real de anunciante/Asaas) tem
esse schema completo, conforme `sql/create_core_tables.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.campaigns (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Não existe nem nunca existiu coluna de preço, CPM ou budget nessa
tabela. Ou seja, o R$25 fixo não é um valor real que alguém esqueceu de
buscar — parece que esse pipeline específico (`campaigns` +
`play_logs_certified` → relatório → `monthly_financial_snapshots`) nunca
teve conexão com preço real desde a origem.

Separadamente, existe uma tabela `"Campaign"` (capitalizada, com aspas)
usada pelo fluxo real de anunciante (`app/api/advertiser/[code]/campaigns/route.ts`),
que tem um campo `budget` real definido pelo anunciante ao criar a
campanha. Não confirmei se esse `budget` é o valor que deveria alimentar
o relatório financeiro, nem se as duas tabelas (`campaigns` minúscula e
`"Campaign"` capitalizada) representam o mesmo conjunto de campanhas ou
sistemas paralelos diferentes — isso exige decisão/contexto do time, não
é algo que dá pra inferir só lendo o código.

## Risco

Se `monthly_financial_snapshots` for usada para decisões financeiras
reais (contabilidade, relatório pra sócio/investidor, declaração fiscal),
os números fechados mês a mês não representam receita real — representam
`(execuções / 1000) × R$25`, uma fórmula sem nenhuma base de preço real.

## Pendências / próximo passo

- [ ] Confirmar se `monthly_financial_snapshots` é consumida por algum
      processo real de contabilidade/relatório financeiro fora deste
      código (planilha, sistema externo, relatório pro contador).
- [ ] Se for usada de verdade: decidir a fonte de preço real (campo
      `budget` da tabela `"Campaign"`? valor por plano do cliente? outra
      coisa?) antes de qualquer correção de código.
- [ ] Se não for usada de verdade (sistema legado/paralelo do front
      `src/` de prova/blockchain, sem relação com a receita real do
      front `app/` de produção): documentar isso explicitamente aqui e
      decidir se vale rotular como "estimativa" na tela ou desativar o
      relatório.
- [ ] Enquanto não decidido, **não chamar `/api/finance/close-month` em
      produção** assumindo que o valor gravado é receita real.
