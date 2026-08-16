# DOOHPLAY - Contrato de API

Este arquivo e a fonte unica de verdade para contratos tecnicos consumidos pelo player web e pelo app Android nativo. O backend web e o `CLAUDE.md` do projeto Android devem referenciar este arquivo, nao manter copias proprias da documentacao.

Se um contrato mudar, atualizar este arquivo primeiro e so entao propagar a mudanca para as frentes web/backend e Android.

Motivo de existir: o incidente de 25/06/2026, com categorias erradas e vazamento entre clientes na playlist, aconteceu porque a frente Android e a frente web tinham copias separadas da documentacao da API. Isso facilitou divergencia silenciosa.

## `GET /api/client/playlist/{code}`

**Quem implementa:** backend web (`app/api/client/playlist/[code]/route.ts`)

**Quem consome:** player web, app Android nativo

### Request

- `code` (path param): codigo do cliente, ex: `BARBE332`. Case-insensitive.

### Response (200)

```json
{
  "ok": true,
  "name": "Barbearia Zimermam",
  "items": [
    {
      "id": "uuid-ou-text",
      "name": "video_123.mp4",
      "type": "video",
      "asset_url": "https://media.doohplay.com.br/studio/CODIGO/arquivo.mp4",
      "status": "approved",
      "slot_category": "dono",
      "duration": 15,
      "active": true,
      "created_at": "2026-06-23T02:42:57.370Z",
      "position": 1,
      "days_of_week": null,
      "start_time": null,
      "end_time": null,
      "start_date": null,
      "end_date": null
    }
  ],
  "slides": [ "...mesmo array de items, alias por compatibilidade..." ],
  "playlist": [ "...mesmo array de items, alias por compatibilidade..." ],
  "generated_at": "2026-06-25T21:06:07.434Z"
}
```

### Regras de negocio obrigatorias

1. **Isolamento por tela:** a resposta nunca deve incluir conteudo de campanha de outro cliente. Toda query de origem de midia deve filtrar explicitamente pelo `code` da tela solicitante.
2. **`slot_category`** e sempre um destes 4 valores: `"dono"`, `"anunciante"`, `"rede"`, `"institucional"`. Nunca hardcoded em um valor fixo. Vem de `CampaignMedia.content_source` (com `"exemplo"` mapeado para `"dono"`), `"rede"` fixo para midia do Clube de Telas, `"institucional"` fixo para midia institucional, `"anunciante"` para anuncio real de terceiro via `CampaignScreen`.
3. Filtrar sempre: `active !== false` e `status !== "rejected"`.

### Sorteio ponderado

Esta logica e do cliente, nao do servidor. Hoje esta duplicada no player web (`app/player/page.tsx`) e no app Android nativo (Kotlin).

- Pesos fixos: `dono: 15`, `anunciante: 60`, `rede: 15`, `institucional: 10`.
- Sortear categoria proporcional ao peso, considerando so categorias com pelo menos 1 item disponivel. O peso das categorias vazias e redistribuido automaticamente.
- Dentro da categoria sorteada, percorrer itens em round-robin, com um cursor por categoria.

Nota de risco conhecido: essa duplicacao pode divergir no futuro. Considerar mover a decisao de sequencia para o backend como melhoria futura, fazendo o servidor retornar a sequencia ja calculada.

## `POST /api/player/heartbeat`

**Quem implementa:** backend web (`app/api/player/heartbeat/route.ts`)

**Quem consome:** player web, app Android nativo

### Request

```json
{ "code": "BARBE332" }
```

Campo preferido: `code`.

O player web historicamente tambem aceita `screen_code` como alias. Manter compatibilidade, mas `code` e o nome preferido para clientes novos.

### Response (200)

```json
{ "ok": true, "ts": "2026-06-26T20:45:25.000Z" }
```

Ou, se o `code` nao corresponder a um `player_id` valido:

```json
{ "ok": false, "warning": "player_id nao encontrado ou invalido para este codigo" }
```

## `POST /api/player/event`

Proof-of-play.

**Quem implementa:** backend web (`app/api/player/event/route.ts`)

**Quem consome:** player web, app Android nativo

### Request

```json
{
  "media_id": "uuid-da-midia",
  "screen_code": "BARBE332",
  "played_at": "2026-06-23T10:00:00.000Z",
  "asset_url": "https://...",
  "duration": 15
}
```

Campo correto: `screen_code`, nao `code`.

Esta inconsistencia com o heartbeat e conhecida e mantida por compatibilidade retroativa. Nao "corrigir" sem avaliar todos os consumidores existentes.

## `GET/POST /api/admin/feature-flags` (NOVO, Fase 45, 16/08/2026)

**Quem implementa:** backend web (`app/api/admin/feature-flags/route.ts`)

**Quem consome:** admin, player web (le via campo `dtv_ready` na playlist, ver abaixo), app Android nativo (idem)

Tabela generica `feature_flags` (`client_code` + `flag_key` unico) — nao criar coluna nova em `screen_templates` a cada feature flag futura. `flag_key` e uma allowlist controlada no backend, mesmo padrao ja usado em `widget_layout_mode`/`widget_position`. Primeira chave usada: `dtv_ready`.

### Request (POST)

```json
{ "client_code": "BARBE332", "flag_key": "dtv_ready", "enabled": true }
```

### Response (200)

```json
{ "ok": true, "client_code": "BARBE332", "flag_key": "dtv_ready", "enabled": true }
```

### Campo novo em `GET /api/client/playlist/{code}` (aditivo)

```json
{
  "...campos existentes inalterados...": "",
  "dtv_ready": false
}
```

`dtv_ready` e sempre `false` por padrao. Ausencia da flag NUNCA muda comportamento existente do player — mesmo padrao "zero mudanca pra quem nao configurou" usado no resto do contrato. Quando `true`, o player web prioriza codec VVC quando disponivel e mostra o selo comercial "TV 3.0 Ready"; e uma flag de compatibilidade/declaracao do instalador, nao deteccao automatica de hardware (nao existe API de browser para consultar dispositivos HDMI-CEC a jusante) nem promessa de recepcao de transmissao aberta de TV 3.0.

## Governanca

1. Qualquer mudanca de contrato precisa ser refletida aqui antes de qualquer codigo.
2. Mudancas que afetam o app Android precisam ser comunicadas explicitamente. Nao assumir que a frente Android vai notar sozinha.
3. Este arquivo nao substitui o Script de Continuidade nem os arquivos `CLAUDE.md`. Ele e especificamente o contrato tecnico de API, enxuto e estavel. Contexto de produto, estrategia e incidentes continua nos outros documentos.
