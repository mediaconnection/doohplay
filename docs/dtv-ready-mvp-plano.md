# DOOHPLAY — Plano Técnico: Fase "TV 3.0 Ready" (MVP)

**Papel:** Arquiteto Agent DOOHPLAY
**Branch:** `feature/dtv-ready-mvp`
**Data:** 16/08/2026

> **Nota de contexto obrigatória (Documento-Mestre v4, seção 3.5):** esta fase
> corresponde à postura "agressiva" do `Documento_Consolidado_Ideias_DOOHPLAY_DTV.docx`,
> que a reconciliação de 15/08/2026 recomendava suspender até os gates do
> Roadmap Técnico serem cumpridos (parceria de espectro, transmissão comercial
> real de TV 3.0). O fundador confirmou explicitamente, em 16/08/2026, seguir
> com essa postura agora, revertendo a recomendação cautelosa. Este plano
> assume essa decisão como válida, mas mantém os riscos técnicos e comerciais
> registrados abaixo — eles não desaparecem só porque a decisão foi tomada.

---

## 1. Objetivo da tarefa

Entregar o mínimo técnico para o player DOOHPLAY (a) sinalizar que uma tela
está pronta para trabalhar junto de um receptor DTV+ externo e (b) priorizar
suporte ao codec VVC quando disponível — sem alterar o Proof Engine
(`src/`) e sem tocar `app/` e `src/` na mesma tarefa.

## 2. Impacto nos fronts

**Só `app/`.** Toda a Fase Ready (detecção no player, feature flag, selo
comercial, textos) vive inteiramente no front de produto comercial. Nenhuma
tabela ou módulo de `src/`/`doohplay-contract/` é tocado. Nenhuma mudança na
Camada 3 (Proof Engine) — impressões/prova continuam exatamente como estão,
mesmo quando o conteúdo é exibido numa tela "TV 3.0 Ready".

## 3. Restrição técnica real (ler antes de implementar o Prompt 2)

O player web (`app/player/page.tsx`) roda dentro de um browser/WebView
(hoje: navegador comum e WebView em Android TV/Fire Stick, ver
`firestick-app/`). **Não existe API de browser padrão para consultar
dispositivos HDMI-CEC a jusante** (ex: "há um conversor DTV+ plugado na
mesma cadeia HDMI da TV?") — isso só é acessível, quando muito, via API
nativa do Android (`HdmiControlManager`), de dentro do app nativo Kotlin,
não de dentro de uma página web.

**Consequência para o MVP, pra não repetir o padrão de risco já registrado
no projeto (certificação ISO 27001 removida do site por não ser real,
10-12/07/2026):** a "detecção" da Fase Ready não pode ser anunciada como
detecção automática de hardware quando na really não é isso. O adapter do
Prompt 2 é honesto sobre isso: é uma **detecção declarativa** (o
instalador/operador confirma no cadastro que existe um receptor DTV+/
conversor externo conectado àquela tela), com um **hook opcional** para o
app Android nativo injetar um sinal automático real no futuro, se/quando o
app nativo passar a expor isso via ponte JS. Sem esse sinal nativo, o
adapter cai em modo declarativo — nunca finge detectar o que não detectou.

## 4. Estrutura de pastas proposta

```
app/
  player/
    dtv/
      types.ts              # tipos TypeScript (DtvReceiverStatus etc.)
      detectReceiver.ts      # lógica do adapter (Prompt 2)
      detectReceiver.test.ts # testes básicos (Prompt 2)
  api/
    admin/
      feature-flags/
        route.ts             # CRUD da flag por client_code (Prompt 3)
  dashboard/
    components/
      DtvReadyBadge.tsx       # selo visual, dashboard do cliente (Prompt 3)
  anunciante/
    [code]/
      components/
        DtvReadyBadge.tsx     # mesmo selo, reaproveitado no portal do anunciante (Prompt 3)
  tv-3-0-ready/
    page.tsx                 # página pública "TV 3.0 Ready" (Prompt 4)
sql/
  phase45_step1_feature_flags.sql   # tabela genérica de feature flags (Prompt 3)
docs/
  api-contract.md            # atualizado ANTES do código (seção nova abaixo)
```

Componente do selo é compartilhado (`components/ui/DtvReadyBadge.tsx` seria
mais correto que duplicar em dois lugares — ajuste sugerido pro Prompt 3:
criar em `components/ui/` e importar nos dois pontos).

## 5. Contrato de API necessário (atualizar `docs/api-contract.md` primeiro)

Duas mudanças de contrato, ambas exclusivamente no front de produto:

1. **Tabela nova `feature_flags`** — genérica (não específica de DTV+), pra
   não ter que criar uma coluna nova em `screen_templates` a cada feature
   flag futura. `client_code + flag_key` único.
2. **Novo endpoint `GET/POST /api/admin/feature-flags`** — lê/grava flags
   por cliente. `dtv_ready` é só a primeira chave usada.
3. **Campo novo em `GET /api/client/playlist/{code}`** (resposta existente,
   aditivo): `dtv_ready: boolean` — pra o player saber se deve considerar
   VVC como prioridade de codec e mostrar o selo, sem precisar de uma
   segunda chamada de rede.

Nenhuma mudança nos contratos de heartbeat ou proof-of-play — a Fase Ready
não gera evento novo de prova.

## 6. Plano passo a passo

1. Atualizar `docs/api-contract.md` com a seção nova (campo `dtv_ready` na
   playlist + endpoint de feature flags) — feito neste plano, ver arquivo.
2. Migração SQL aditiva `sql/phase45_step1_feature_flags.sql` (tabela nova,
   não mexe em tabela existente).
3. Código Agent implementa o adapter (`app/player/dtv/`) — Prompt 2.
4. Código Agent implementa a API de feature flags + consome no player e no
   dashboard/anunciante — Prompt 3.
5. Docs & Produto Agent gera a página pública, texto comercial e FAQ,
   deixando claro no texto que é "pronto para o padrão TV 3.0" no sentido
   de compatibilidade de player/codec, não promessa de recepção de
   transmissão aberta hoje — Prompt 4.

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Anunciar "detecção automática" que na verdade é declarativa (repete o padrão ISO 27001) | Texto comercial (Prompt 4) descreve exatamente o que a flag significa hoje: compatibilidade de player + declaração do instalador, não detecção de sinal de transmissão real |
| Cliente interpretar "TV 3.0 Ready" como "já recebe canais de TV aberta" | FAQ explícito cobrindo essa pergunta (Prompt 4) |
| Cobrar upgrade por algo que não entrega valor mensurável ainda | Fora do escopo técnico deste plano — decisão comercial/pricing já é do fundador, não deste agente |
| Tabela `feature_flags` genérica demais e usada de forma inconsistente no futuro | Documentar em `docs/api-contract.md` que `flag_key` é uma allowlist controlada no backend, igual ao padrão já usado em `widget_layout_mode`/`widget_position` |
| Quebrar o player em telas sem receptor DTV+ (imensa maioria hoje) | `dtv_ready` default `false`; ausência da flag não muda nenhum comportamento existente — mesmo padrão "zero mudança pra quem não configurou" já usado em todo o arquivo `app/player/page.tsx` |

## 8. Checklist de validação

- [ ] `docs/api-contract.md` atualizado antes do código (feito)
- [ ] Migração SQL é aditiva (`CREATE TABLE IF NOT EXISTS`), reversível
- [ ] Nenhum arquivo de `src/` ou `doohplay-contract/` tocado nesta fase
- [ ] `dtv_ready: false` por padrão — nenhuma tela existente muda de
      comportamento sem configuração explícita
- [ ] Testes básicos do adapter cobrem: sem sinal nativo (modo
      declarativo), com sinal nativo simulado, flag desligada
- [ ] Texto comercial revisado para não prometer recepção de transmissão
      real hoje
- [ ] Aprovação humana explícita antes de qualquer merge em `demo-master`
      (Front Isolation Policy — toca `app/`, ainda que não afete BARBE332
      diretamente enquanto a flag estiver desligada por padrão)
