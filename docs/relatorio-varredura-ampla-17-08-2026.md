# DOOHPLAY — Relatório da varredura ampla de conteúdo (17/08/2026)

> Escopo: revisão de conteúdo/honestidade em todas as áreas logadas
> restantes do front de produção (`app/`), seguindo o modo "varredura
> ampla + relatório único" escolhido pelo fundador. Método: leitura
> completa dos arquivos menores/mais sensíveis, grep dirigido por padrões
> de fabricação (marcas reais, números fixos apresentados como reais,
> nome errado de blockchain, "mock"/"fake"/"lorem") nos arquivos maiores.
> Interrompi o fundador apenas nos achados de maior risco (dinheiro real,
> marca real) — o resto está listado aqui pra triagem.

## O que foi corrigido nesta sessão (já commitado, `2299dad` em `demo-master`)

1. **`app/explorer/page.tsx`** (ProofChain Explorer, página pública) — a
   lista de exemplo (`DEMO_EVENTS`), usada quando `/api/explorer/data` não
   retorna dados reais, atribuía campanhas fictícias com status
   "Verified"/"Ancorado" na blockchain a marcas reais: Bradesco, iFood,
   Samsung, Natura, Ambev. Trocado por categorias genéricas. Também
   corrigido "Ethereum" → "Polygon" em 3 lugares (o nome real da rede
   usada pelo DOOHPLAY, mesmo erro já corrigido antes no Trust Center).

2. **Mockups de TV em 5 landing pages de segmento** — o preview de tela
   usava logos reais como "anunciante patrocinado" de exemplo:
   `iFood` em `/barbearias`, `/padarias`, `/bares-restaurantes` (trocado
   por "PedeJá", fictício) e `PagBank` em `/moda`, `/varejo-mercado`
   (trocado por "PagFácil", fictício). As outras 9 páginas de segmento já
   usavam nomes fictícios corretos (SaúdePlus, SegurAuto, CrediCasa,
   MaxProtein, PetLove etc.) — não precisaram de correção.

3. **Badge de ganho fixo nas 12 landing pages de segmento com TV mockup**
   (`+R$300` a `+R$400/mês`) — marcado com "*" e nota "Estimativa de
   exemplo — valor real varia por local e demanda de anunciantes", mesmo
   padrão já aplicado em `/pitch` e `/materiais-venda` nesta sessão.

4. **`app/admin/page.tsx`** — o texto da aba "Conteúdo Institucional"
   dizia que esse conteúdo ocupa "≈10% do sorteio ponderado". A lógica
   real (`app/api/client/playlist/[code]/route.ts`) é 5% pra conteúdo
   institucional genérico e 20% pra conteúdo de "canal" com segmento
   definido — confirmado que outras duas telas do mesmo admin já mostram
   5%/20% corretamente. Corrigido pra bater com a lógica real.

5. **`app/dashboard/financeiro/[code]/page.tsx`** — paleta local
   `blue: #2563EB` / `green: #16A34A` trocada pra `#3B82F6` / `#10B981`
   (cor de marca usada no resto do site), mesmo ajuste já feito em 4
   outros arquivos nesta sessão.

## Achados registrados, não corrigidos (decisão do fundador)

### 1. Score 100/100 fixo + link de prova que não corresponde à exibição real

Documentado em `docs/achado-score-fixo-prova-fake-zimerman-meninos.md`.
Em `/zimerman`, `/meninos-da-vila` e `app/advertiser/page.tsx`: o "Score
de confiança" mostrado é sempre 100/100 (texto fixo, não vem do banco), e
o botão "Ver prova" sempre aponta pro mesmo hash de demonstração,
ignorando o hash real de cada exibição (que a própria linha já mostra
corretamente). `app/portal/[code]/page.tsx` já faz isso do jeito certo e
serve de referência pra corrigir os outros três.

### 2. CPM fixo de R$25 em relatório e fechamento financeiro

Documentado em `docs/achado-cpm-fixo-relatorio-financeiro.md` (achado de
sessão anterior). `app/dashboard/reports/campaigns/page.tsx` e o endpoint
irreversível `app/api/finance/close-month/route.ts` calculam receita com
`(execuções / 1000) × R$25` fixo, sem relação com preço real cobrado.

### 3. Preço inconsistente entre `/onboarding` e o resto do site

Novo achado desta varredura, não documentado em arquivo separado ainda.
`app/onboarding/page.tsx` (fluxo de cadastro de novo cliente) mostra os
planos **Starter R$197 / Pro R$347 / Multi R$547**. Todo o resto do site
que cobra por assinatura de tela — `/planos` (página pública de preços),
`app/admin/page.tsx` (ferramenta interna de criar assinatura) e as 12
landing pages de segmento — usa **Starter R$97 / Pro R$290 / Business
R$620**. São valores e até nomes de plano diferentes ("Multi" vs
"Business") pro que parece ser o mesmo produto. Envolve dinheiro real
cobrado de clientes reais — vale confirmar qual conjunto de preços está
correto antes de decidir o que fazer.

### 4. `/explorer` — escala fabricada do "block explorer"

Achado colateral ao corrigir os nomes de marca real: mesmo depois da
correção, a lista de fallback (`DEMO_BLOCKS`) simula uma blockchain
madura com blocos na casa de 19,28 milhões e centenas de transações por
bloco (`txs: 847`, `923` etc.) — números fixos, não vêm de
`/api/explorer/data`. Isso é diferente do problema dos nomes de marca (já
corrigido): é acerca da escala/maturidade aparente da rede, parecido com
o achado já corrigido na landing page real (contadores "REDE NACIONAL"
fabricados). Não mexi nisso agora porque decidir o que mostrar quando não
há dados reais (tela vazia? número real, mesmo que pequeno?) é uma
decisão de produto, não só uma correção mecânica de marca.

## Itens já conhecidos de sessões anteriores (recapitulando pro fechamento)

Ainda pendentes de decisão, sem mudança nesta sessão:

- SOC2/KPMG removido do Trust Center, mas nunca confirmado se a
  certificação existe de verdade.
- Revisão jurídica formal dos textos "TV 3.0 Ready" — nunca feita.
- Cards de stats da seção PERSONAS e tabela de exemplo do ProofChain
  Explorer na landing page real — marcados como exemplo, mas nunca
  formalmente revisados por completo.
- ~~"Ganhos Futuros" (projeção fixa), KPI "+12% esta semana" e banner
  "engajamento em até 40%" no dashboard do cliente — fundador escolheu
  manter por enquanto.~~ **Resolvido em 18/08/2026**: revisitado a
  pedido do fundador. KPI virou "Hoje" (sem % inventado), "Ganhos
  Futuros" ganhou aviso de "exemplo ilustrativo" e rótulos sem alegar
  cálculo de IA, banner perdeu o número sem lastro. Commit `9b92e40`.
- ~~AI Revenue Center: nomes de marca já trocados por categoria genérica
  (feito antes), mas match%/valor/projeção/dicas continuam fixos.~~
  **Resolvido em 18/08/2026**: números continuam fixos (mesmos pra
  qualquer cliente) — isso não mudou —, mas a tela parou de afirmar que
  uma IA real gerou esses dados: badge "IA Ativa" -> "Simulação",
  "identificamos"/"identificadas pela IA" -> linguagem de exemplo
  ilustrativo. Commit `9b92e40`.

## Áreas varridas e confirmadas limpas (sem achados)

- `app/anunciante/` (portal do anunciante) — lógica de preço sugerido já
  era honestamente rotulada como referência.
- `app/agencia/[code]/page.tsx` — 100% dados reais via API.
- `app/crm/page.tsx` — CRM vazio por padrão, sem leads fabricados
  (mas nota: dados só ficam no `localStorage` do navegador, não são
  compartilhados entre membros da equipe nem persistem no banco — vale
  avaliar se isso é intencional).
- `app/studio/[code]/page.tsx` — real, mas o botão "Ver portal" tem
  `/zimerman` hardcoded em vez de `/portal/${code}` — bug funcional (não
  de conteúdo): qualquer cliente usando o Studio cai no portal do
  Zimermam ao clicar, não no seu próprio.
- `app/admin/` (login, layout, reports, risk, metrics) — sem achados.
- `app/onboarding/`, `/portal/[code]`, `/embed/[hash]`, `/enquete`,
  `/instalar`, `/login`, `/noc`, `/turismo` e as rotas de
  proof/ledger/audit/trust/network/explorer restantes — sem achados além
  do já listado acima.
- 9 das 13 landing pages de segmento não precisaram de correção de marca
  (só as 12 já ajustadas no badge de estimativa).

## Pendências / próximo passo

- [ ] Decidir o preço correto dos planos (`/onboarding` vs. resto do
      site) e corrigir o lado que estiver errado.
- [ ] Decidir quando corrigir o achado do Score 100/100 fixo (arquivo
      próprio já documentado).
- [ ] Decidir quando corrigir o CPM fixo de R$25 (arquivo próprio já
      documentado).
- [ ] Decidir o que fazer com a escala fabricada do `/explorer` (achado
      #4 acima).
- [ ] Corrigir o bug do botão "Ver portal" no Studio (`/zimerman`
      hardcoded).
- [ ] Avaliar se o CRM deveria persistir no banco em vez de só
      `localStorage`.
