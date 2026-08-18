# DOOHPLAY — Achado: Score fixo e link de prova incorreto em páginas públicas de clientes reais

> Papel: revisão de conteúdo/produto (não é revisão de engenharia). Achado
> durante a varredura ampla de 17/08/2026. Registrado aqui em vez de
> corrigido no código porque envolve páginas públicas de clientes reais e
> pagantes — decisão de correção adiada a pedido do fundador para tratar
> com calma, não por falta de solução técnica (a solução é conhecida, ver
> "Como corrigir" abaixo).

## O que foi encontrado

Duas páginas públicas de verificação, servindo dois clientes reais e
pagantes, têm dois problemas de honestidade de conteúdo:

1. `app/zimerman/page.tsx` (Barbearia Zimermam)
2. `app/meninos-da-vila/page.tsx` (Bar Meninos da Vila)

Ambas são páginas estáticas dedicadas (não usam a rota genérica
`/portal/[code]`), com dados reais de exibição vindos do banco
(`display_events` via `pool.query`), mas com dois pontos fabricados:

### 1. "Score de confiança: 100/100" fixo

```tsx
{ label: "Score de confiança", value: "100/100", accent: true },
```

Não vem de nenhuma coluna do banco — está hardcoded como texto fixo,
diferente de todo o resto da página (exibições, data, hash), que é
real. Sempre mostra nota máxima, para qualquer cliente, a qualquer
momento.

Comparação: a rota genérica `app/portal/[code]/page.tsx` (linha ~176)
já faz isso do jeito certo:
```ts
const trustScore = player?.trust_score ?? 97
```
Busca a coluna real `trust_score` do banco, com fallback honesto (97,
não 100) só quando o dado não existe.

### 2. Link "Ver prova" aponta sempre pro mesmo hash de demonstração

Cada linha de exibição mostra um hash real e distinto
(`shortHash(play.event_hash)`), mas o botão "Ver prova" ao lado ignora
esse hash e sempre linka pro mesmo `DEMO_HASH` fixo:

```tsx
const DEMO_HASH = "20ec722b179a772ddc19c2a6053326906da1e598cc3dcaeed4a48efee2f950be"
...
<Link href={`/verify/${DEMO_HASH}`}>Ver prova</Link>
```

Isso significa que qualquer visitante que clique em "Ver prova" em
qualquer exibição listada — de qualquer data, de qualquer campanha —
cai sempre na mesma prova de demonstração, não na prova real daquela
exibição específica. A página promete "prova criptográfica em cada
exibição" e "verificação pública", mas o link não verifica a exibição
que o usuário clicou.

Comparação: a rota genérica `app/portal/[code]/page.tsx` (linha ~369)
já faz isso do jeito certo:
```tsx
<Link href={`/verify/${play.event_hash || DEMO_HASH}`}>
```
Usa o hash real da linha primeiro, e só cai no `DEMO_HASH` como
fallback quando aquela exibição específica não tem hash.

## Por que isso é mais sensível que outros achados da sessão

Diferente da maioria dos achados anteriores (números de exemplo em
landing pages, dashboards internos), estas são páginas públicas,
específicas de dois clientes reais e pagantes (Zimermam e Meninos da
Vila), e o problema está exatamente no núcleo da proposta de valor do
DOOHPLAY — prova criptográfica verificável. Um cliente do Zimermam ou
Meninos da Vila (ou concorrente, ou jornalista) pode acessar a página
pública, clicar em "verificar" numa exibição específica e cair numa
prova que não é daquela exibição.

## Como corrigir (quando decidido)

Mesmo padrão já implementado em `app/portal/[code]/page.tsx`:

1. Buscar `trust_score` real do cliente (mesma query/coluna usada na
   rota genérica) em vez do texto fixo `"100/100"`.
2. Trocar `DEMO_HASH` fixo no link "Ver prova" por
   `play.event_hash || DEMO_HASH` — usa o hash real de cada linha,
   cai no demo só quando não existe.

Ambas as mudanças são mecânicas e de baixo risco — não alteram lógica
de negócio, só corrigem os dois pontos hardcoded pra usar o mesmo dado
real que a página já busca do banco.

## Atualização (mesma varredura, 17/08/2026): o mesmo padrão existe em `app/advertiser/page.tsx`

Encontrado durante a continuação da varredura ampla: `app/advertiser/page.tsx`
(linha ~335) tem o mesmo texto fixo `Score 100/100` no rodapé da tabela de
exibições, e o link "Ver prova" (linha ~322) é um hash literal hardcoded
(`/verify/20ec722b...`) igual ao `DEMO_HASH` das outras duas páginas — mesmo
a tabela já mostrando `play.event_hash` real e distinto por linha
(`shortHash(play.event_hash)`, linha ~318). Ou seja, o mesmo bug de "link de
prova não corresponde à exibição clicada" existe aqui também, num total de
pelo menos 3 arquivos. Não foi feita uma varredura exaustiva de todas as
páginas de prova/ledger/proofchain à procura de outras ocorrências — dado o
padrão se repetir em arquivos não relacionados entre si, é provável que
exista em mais lugares (candidatos naturais: outras páginas que copiam esse
mesmo bloco de exibição de prova, sob `app/ledger/`, `app/proof/`,
`app/proofchain/`).

## Mapeamento completo (grep por `DEMO_HASH` / pelo hash literal em todo `app/`)

```
app/advertiser/page.tsx        ← bug (link fixo, mesmo tendo hash real por linha)
app/api/certificate/route.ts   ← uso legítimo (fallback de geração de certificado)
app/meninos-da-vila/page.tsx   ← bug
app/portal/[code]/page.tsx     ← correto (usa play.event_hash || DEMO_HASH)
app/verify/page.tsx            ← uso legítimo (exemplo no campo de busca)
app/zimerman/page.tsx          ← bug
```

Confirmado: são exatamente 3 arquivos com o bug (`advertiser`, `meninos-da-vila`,
`zimerman`), 1 arquivo com o padrão correto (`portal/[code]`) que serve de
referência pra correção, e 2 usos do hash que são legítimos e não precisam
mudar. Não há mais nenhuma ocorrência escondida em outro lugar do `app/`.

## Pendências / próximo passo

- [ ] Decidir quando aplicar a correção acima nos 3 arquivos com o bug
      (`/zimerman`, `/meninos-da-vila`, `/advertiser`), usando
      `app/portal/[code]/page.tsx` como referência do padrão correto.
- [ ] Decidir também sobre o `Score 100/100` fixo, que aparece nos mesmos
      3 arquivos (ver seção principal acima).
