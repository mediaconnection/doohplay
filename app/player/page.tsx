// app/player/page.tsx
// Página exibida na TV via Fire Stick — modo kiosk, sem nav, fullscreen
export const dynamic = "force-dynamic"

import { getPool } from "@/lib/db"
import { detectDtvReceiver } from "./dtv/detectReceiver"

interface PlayerMediaRow {
  name: string;
  business_type: string;
  primary_color: string;
  id: string;
  media_name: string;
  media_type: string;
  media_url: string;
  duration: number;
  active: boolean;
  position: number;
  slot_category: SlotCategory;
  transition_effect: string | null;
}

type SlotCategory = "dono" | "anunciante" | "rede" | "institucional" | "canal";
type DisplayFormat = "fullscreen" | "shrink_lateral" | "banner_bottom" | "floating";

interface PlayerMedia {
  id: string;
  name: string;
  type: string;
  url: string;
  duration: number;
  category: SlotCategory;
  displayFormat: DisplayFormat;
  layoutZones?: any[] | null;   // preenchido quando type === 'layout'
  sequenceGroup?: string | null; // itens institucionais do mesmo grupo tocam em bloco
  zoneContent?: Record<string, { type: string; url: string; name: string }> | null; // conteúdo escolhido por zona (Fase 9c)
  // Fase 29 (20/07/2026): transição escolhida por vídeo/imagem individual
  // (feedback de cliente: "a transição não deveria ser uma só pra
  // tela toda"). null = usa o padrão da tela (screen_templates), mesmo
  // comportamento de antes.
  transitionEffect?: string | null;
}

async function getPlayerData(code: string) {
  const pool = getPool()
  const upperCode = code.toUpperCase()
  try {
    // ── Cliente + conteúdo do dono e de anunciantes (CampaignMedia) ──
    const clientQuery = pool.query<PlayerMediaRow>(`
      SELECT
        sc.name,
        sc.business_type,
        sc.primary_color,
        sc.audio_enabled,
        cm.id,
        cm.name              AS media_name,
        cm.type               AS media_type,
        cm.url                AS media_url,
        COALESCE(ps.duration, 15)     AS duration,
        COALESCE(ps.active, true)     AS active,
        COALESCE(ps.position, 0)      AS position,
        cm.content_source             AS slot_category,
        cm.transition_effect          AS transition_effect
      FROM studio_clients sc
      LEFT JOIN "Campaign" c ON c."advertiserCode" = sc.code
      LEFT JOIN "CampaignMedia" cm ON cm."campaignId" = c.id
      LEFT JOIN playlist_schedule ps ON ps.media_id = cm.id AND ps.client_code = sc.code
      WHERE sc.code = $1
        AND sc.active = true
      ORDER BY COALESCE(ps.position, 999), cm."createdAt" ASC
    `, [upperCode])

    // ── Rede (Clube de Telas) — mídias de parceiros distribuídas para esta tela ──
    const networkQuery = pool.query<{ id: string; name: string; type: string; url: string }>(`
      SELECT nm.id, nm.name, nm.type, nm.url
      FROM network_media_distribution nmd
      JOIN network_media nm ON nm.id = nmd.network_media_id
      WHERE nmd.displayed_on_code = $1
        AND nmd.active = true
        AND nm.status = 'approved'
    `, [upperCode])

    // ── Institucional (DOOHPLAY) — exibido em todas as telas ──
    const institutionalQuery = pool.query<{
      id: string; name: string; type: string; url: string; duration: number; display_format: string;
      layout_template_id: string | null; sequence_group: string | null; layout_zones: any; zone_content: any;
    }>(`
      SELECT im.id, im.name, im.type, im.url, im.duration, im.display_format,
             im.layout_template_id, im.sequence_group, lt.zones AS layout_zones, im.zone_content
      FROM institutional_media im
      LEFT JOIN layout_templates lt ON lt.id = im.layout_template_id
      WHERE im.active = true
      ORDER BY im.position ASC
    `)

    // ── Anunciante real — campanha de terceiro vinculada a esta tela ──
    const realAdsQuery = pool.query<{ id: string; name: string; type: string; url: string; display_format: string }>(`
      SELECT cm.id, cm.name, cm.type, cm.url, cm.display_format
      FROM "CampaignScreen" cs
      JOIN "Campaign" c ON c.id = cs."campaignId"
      JOIN "CampaignMedia" cm ON cm."campaignId" = c.id
      WHERE cs."screenId" = $1
        AND c.status = 'active'
        AND c."startDate" <= NOW()
        AND c."endDate" >= NOW()
        AND cm.status != 'rejected'
    `, [upperCode])

    const [clientRes, networkRes, institutionalRes, realAdsRes] = await Promise.all([
      clientQuery, networkQuery, institutionalQuery, realAdsQuery,
    ])
    const rows = clientRes.rows

    // Fase 33 (20/07/2026): valida o valor que vem do banco contra o
    // conjunto real de formatos suportados — nunca deixa um valor
    // inesperado (dado antigo, digitação manual no banco, etc.) quebrar
    // o player; cai pro fullscreen, o mais seguro.
    function normalizeDisplayFormat(v: string | null | undefined): DisplayFormat {
      return (v === "shrink_lateral" || v === "banner_bottom" || v === "floating")
        ? v
        : "fullscreen"
    }

    const ownAndAds: PlayerMedia[] = rows
      .filter((r: PlayerMediaRow) => r.media_url && r.active)
      .map((r: PlayerMediaRow) => ({
        id: r.id,
        name: r.media_name,
        type: r.media_type,
        url: r.media_url,
        duration: Number(r.duration) || 15,
        category: (r.slot_category as SlotCategory) || "dono",
        displayFormat: "fullscreen" as DisplayFormat,
        transitionEffect: r.transition_effect ?? null,
      }))

    const network: PlayerMedia[] = networkRes.rows.map((r: { id: string; name: string; type: string; url: string }) => ({
      id: r.id, name: r.name, type: r.type, url: r.url, duration: 15, category: "rede" as SlotCategory,
      displayFormat: "fullscreen" as DisplayFormat,
    }))

    const institutional: PlayerMedia[] = institutionalRes.rows.map((r: {
      id: string; name: string; type: string; url: string; duration: number; display_format: string;
      layout_template_id: string | null; sequence_group: string | null; layout_zones: any; zone_content: any;
    }) => ({
      id: r.id, name: r.name, type: r.type, url: r.url,
      duration: Number(r.duration) || 15, category: "institucional" as SlotCategory,
      displayFormat: normalizeDisplayFormat(r.display_format),
      layoutZones: r.layout_zones ?? null,
      sequenceGroup: r.sequence_group ?? null,
      zoneContent: r.zone_content ?? null,
    }))

    // Fase 33 (20/07/2026): antes, todo anúncio pago vinha fixo em
    // fullscreen — display_format nem era lido do banco. Agora respeita
    // a escolha feita na aprovação do admin (lateral/faixa/flutuante).
    const realAds: PlayerMedia[] = realAdsRes.rows.map((r: { id: string; name: string; type: string; url: string; display_format: string }) => ({
      id: r.id, name: r.name, type: r.type, url: r.url, duration: 15, category: "anunciante" as SlotCategory,
      displayFormat: normalizeDisplayFormat(r.display_format),
    }))

    // ── Template (Fase 3b) — configuração de widgets por cliente/tela ──
    // Por enquanto resolvido a nível de cliente (screen_id NULL). Diferenciar
    // por tela física específica depende de o player identificar qual tela
    // está carregando a página (V96 vs T600 hoje carregam a mesma URL
    // /player?screen=CODE) — fica registrado como limitação conhecida.
    const templateRes = await pool.query<{
      template_key: string; location_lat: number; location_lon: number;
      location_name: string; stock_tickers: string[]; news_country: string; transition_effect: string;
      widget_layout_mode: string; widget_position: string;
    }>(`
      SELECT template_key, location_lat, location_lon, location_name, stock_tickers, news_country, transition_effect, widget_layout_mode, widget_position
      FROM screen_templates
      WHERE client_code = $1 AND active = true
      ORDER BY screen_id NULLS LAST
      LIMIT 1
    `, [upperCode])
    const template = templateRes.rows[0] || null

    // Fase 45 (16/08/2026) — flag "TV 3.0 Ready" (dtv_ready), ver
    // docs/dtv-ready-mvp-plano.md e docs/api-contract.md. Consulta em
    // try/catch PRÓPRIO, separado do try/catch geral desta função: se a
    // migração sql/phase45_step1_feature_flags.sql ainda não rodou nesse
    // ambiente (tabela feature_flags não existe), a tela não pode ficar
    // em branco por causa de uma feature opcional — cai em "false" e
    // segue o fluxo normal, igual a qualquer cliente sem a flag.
    let dtvReadyFlag = false
    try {
      const dtvRes = await pool.query<{ enabled: boolean }>(
        `SELECT enabled FROM feature_flags WHERE client_code = $1 AND flag_key = 'dtv_ready' LIMIT 1`,
        [upperCode]
      )
      dtvReadyFlag = dtvRes.rows[0]?.enabled === true
    } catch (dtvErr) {
      console.error("[player/page getPlayerData] feature_flags indisponível (migração Fase 45 pendente?), dtv_ready cai em false:", dtvErr)
    }
    // Detecção declarativa (ver app/player/dtv/detectReceiver.ts) — não é
    // leitura de hardware real; sem ponte nativa Android disponível hoje,
    // isso sempre resolve a partir da flag configurada no admin.
    const dtvStatus = detectDtvReceiver({ dtvReadyFlag })

    async function fetchWidgetsData(tpl: typeof template) {
      const lat = tpl?.location_lat ?? -23.5505
      const lon = tpl?.location_lon ?? -46.6333
      const locationName = tpl?.location_name || "São Paulo"
      const tickers = (tpl?.stock_tickers?.length ? tpl.stock_tickers : ["PETR4", "VALE3", "MGLU3", "ITUB4"])
        .filter((t: string) => ["PETR4", "VALE3", "MGLU3", "ITUB4"].includes(t))

      const WMO: Record<number, { label: string; emoji: string }> = {
        0: { label: "Céu limpo", emoji: "☀️" }, 1: { label: "Principalmente limpo", emoji: "🌤️" },
        2: { label: "Parcialmente nublado", emoji: "⛅" }, 3: { label: "Nublado", emoji: "☁️" },
        45: { label: "Neblina", emoji: "🌫️" }, 51: { label: "Garoa leve", emoji: "🌦️" },
        61: { label: "Chuva leve", emoji: "🌧️" }, 63: { label: "Chuva moderada", emoji: "🌧️" },
        80: { label: "Pancadas leves", emoji: "🌦️" }, 95: { label: "Tempestade", emoji: "⛈️" },
      }

      // Fase 43 (21/08/2026, revisado): câmbio/indicadores/loteria — trocado
      // de brapi.dev (que exigiria BRAPI_TOKEN pago) pras mesmas fontes
      // públicas e gratuitas já validadas em produção por outra sessão
      // (commits 506d738..3f7a78f, 21/07/2026, direto no GitHub): AwesomeAPI
      // pro câmbio, Banco Central (BCB) pros indicadores, e o endpoint
      // público da Caixa pra loteria. Nenhuma das 5 fontes novas depende de
      // token — mais simples de manter, sem risco de plano pago expirar.
      const [weatherRes, stocksRes, newsRes, econNewsRes, cambioRes, selicRes, cdiRes, ipcaRes, airQualityRes, loteriaRes] = await Promise.allSettled([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=America%2FSao_Paulo`, { next: { revalidate: 1800 } }),
        fetch(`https://brapi.dev/api/quote/${tickers.join(",")}`, { next: { revalidate: 300 } }),
        fetch(`https://g1.globo.com/rss/g1/`, { headers: { "User-Agent": "DOOHPLAY/1.0" }, next: { revalidate: 300 } }),
        // Fase 39 (20/07/2026): mesma fonte (G1), só a seção de Economia —
        // usada pro widget "bolsa revezando com notícia de mercado".
        fetch(`https://g1.globo.com/rss/g1/economia/`, { headers: { "User-Agent": "DOOHPLAY/1.0" }, next: { revalidate: 300 } }),
        // Fase 43: câmbio — AwesomeAPI, público, sem token.
        fetch(`https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL`, { next: { revalidate: 600 } }),
        // Fase 43: Selic — série 432 é a Meta Selic definida pelo Copom, em
        // % a.a. (a série 11 é a diária, formato errado pro widget — achado
        // real em teste da outra sessão, 21/07/2026). Confirmado na doc
        // oficial (dadosabertos.bcb.gov.br).
        fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json`, { next: { revalidate: 3600 } }),
        // CDI anualizado (série 4389, % a.a.) — mesmo motivo da Selic acima.
        fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json`, { next: { revalidate: 3600 } }),
        // IPCA 12 meses acumulado.
        fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json`, { next: { revalidate: 3600 } }),
        // Fase 43: qualidade do ar — Open-Meteo (mesma família da previsão
        // do tempo acima), sem token.
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=America%2FSao_Paulo`, { next: { revalidate: 3600 } }),
        // Fase 43: loteria — endpoint público da Caixa (Mega-Sena), sem
        // token; é nacional, não depende de localização do cliente.
        fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena`, { headers: { "User-Agent": "DOOHPLAY/1.0" }, next: { revalidate: 3600 } }),
      ])

      let weather = null, stocks: any[] = [], news: any[] = [], econNews: any[] = []
      let cambio: any[] = []
      let indicadores: any[] = []
      let airQuality: { usAqi: number; pm25: number } | null = null
      let loteria: { jogo: string; concurso: number; data: string; dezenas: string[]; acumulou: boolean } | null = null
      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        const w = await weatherRes.value.json()
        const code = w.current?.weather_code ?? 0
        weather = {
          temperature: Math.round(w.current?.temperature_2m ?? 0),
          code, ...(WMO[code] ?? { label: "—", emoji: "🌡️" }),
          location: locationName,
          // Fase 30 (20/07/2026): grid de detalhe do clima — feedback de
          // cliente prospectado pedindo "mais widgets"; Open-Meteo já
          // oferecia esses 3 campos de graça, só não estavam sendo pedidos.
          feelsLike: Math.round(w.current?.apparent_temperature ?? w.current?.temperature_2m ?? 0),
          humidity: Math.round(w.current?.relative_humidity_2m ?? 0),
          windSpeed: Math.round(w.current?.wind_speed_10m ?? 0),
        }
      }
      if (stocksRes.status === "fulfilled" && stocksRes.value.ok) {
        const s = await stocksRes.value.json()
        stocks = (s.results || []).map((r: any) => ({
          symbol: r.symbol, price: r.regularMarketPrice, changePercent: r.regularMarketChangePercent,
        }))
      }
      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const xml = await newsRes.value.text()
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let m
        while ((m = itemRegex.exec(xml)) !== null && news.length < 4) {
          const item = m[1]
          const rawTitle = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ""
          const title = rawTitle.replace(/<[^>]*>/g, "").trim()
          if (title) news.push({ title })
        }
      }
      // Fase 39 (20/07/2026): mesmo parsing, fonte de economia.
      if (econNewsRes.status === "fulfilled" && econNewsRes.value.ok) {
        const xml = await econNewsRes.value.text()
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let m
        while ((m = itemRegex.exec(xml)) !== null && econNews.length < 4) {
          const item = m[1]
          const rawTitle = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ""
          const title = rawTitle.replace(/<[^>]*>/g, "").trim()
          if (title) econNews.push({ title })
        }
      }
      // Fase 43: câmbio — AwesomeAPI devolve um objeto chaveado por par
      // (ex: "USDBRL"), não uma lista — normaliza pro mesmo formato que
      // renderWidgetHtml("cambio") já espera (from/to/name/bid/pct).
      if (cambioRes.status === "fulfilled" && cambioRes.value.ok) {
        const c = await cambioRes.value.json()
        const pares: Record<string, { from: string; to: string; name: string }> = {
          USDBRL: { from: "USD", to: "BRL", name: "Dólar" },
          EURBRL: { from: "EUR", to: "BRL", name: "Euro" },
        }
        cambio = Object.keys(pares)
          .filter((k) => c[k])
          .map((k) => ({
            from: pares[k].from, to: pares[k].to, name: pares[k].name,
            bid: Number(c[k].bid ?? 0), pct: Number(c[k].pctChange ?? 0),
          }))
      }
      // Fase 43: indicadores — 3 séries separadas do Banco Central (Selic
      // meta a.a., CDI anualizado a.a., IPCA 12m), cada uma normalizada pro
      // mesmo formato que renderWidgetHtml("indicadores") já espera
      // (slug/name/value/unit). Só entra no array a série que respondeu.
      async function parseBcbValue(res: PromiseSettledResult<Response>): Promise<number | null> {
        if (res.status !== "fulfilled" || !res.value.ok) return null
        const arr = await res.value.json()
        const v = arr?.[0]?.valor
        return v != null ? Number(v) : null
      }
      const [selicValue, cdiValue, ipcaValue] = await Promise.all([
        parseBcbValue(selicRes), parseBcbValue(cdiRes), parseBcbValue(ipcaRes),
      ])
      indicadores = [
        selicValue !== null ? { slug: "selic", name: "Selic", value: selicValue, unit: "%" } : null,
        cdiValue !== null ? { slug: "cdi", name: "CDI", value: cdiValue, unit: "%" } : null,
        ipcaValue !== null ? { slug: "ipca12m", name: "IPCA (12m)", value: ipcaValue, unit: "%" } : null,
      ].filter(Boolean) as any[]
      if (airQualityRes.status === "fulfilled" && airQualityRes.value.ok) {
        const aq = await airQualityRes.value.json()
        if (aq.current?.us_aqi != null) {
          airQuality = {
            usAqi: Math.round(aq.current.us_aqi),
            pm25: Math.round(aq.current.pm2_5 ?? 0),
          }
        }
      }
      // Fase 43: loteria — endpoint da Caixa devolve numero/dataApuracao/
      // listaDezenas/acumulado — normaliza pro mesmo formato que
      // renderWidgetHtml("loteria") já espera (jogo/concurso/data/dezenas/
      // acumulou).
      if (loteriaRes.status === "fulfilled" && loteriaRes.value.ok) {
        const lo = await loteriaRes.value.json()
        if (Array.isArray(lo.listaDezenas) && lo.listaDezenas.length) {
          loteria = {
            jogo: "Mega-Sena", concurso: lo.numero, data: lo.dataApuracao,
            dezenas: lo.listaDezenas, acumulou: !!lo.acumulado,
          }
        }
      }
      return { weather, stocks, news, econNews, cambio, indicadores, airQuality, loteria }
    }

    let widgets: { weather: any; stocks: any; news: any; econNews: any; cambio: any; indicadores: any; airQuality: any; loteria: any } | null = null
    if (template?.template_key === "magazine") {
      widgets = await fetchWidgetsData(template)
    }

    // ── Enquete ativa (Fase 7) — interatividade via QR code ──────────────
    // Roda pra qualquer cliente com uma enquete ativa, independente de
    // template_key/layout. Resultado inicial vem no SSR; o player atualiza
    // sozinho a cada ~15s via JS (mais rápido que o resto, pra parecer
    // "ao vivo" de verdade enquanto as pessoas votam pelo celular).
    let poll: { id: string; question: string; options: string[]; counts: number[]; total: number } | null = null
    const pollRes = await pool.query<{ id: string; question: string; options: string[] }>(`
      SELECT id, question, options FROM polls
      WHERE client_code = $1 AND active = true
      ORDER BY created_at DESC LIMIT 1
    `, [upperCode])
    if (pollRes.rows[0]) {
      const votesRes = await pool.query<{ option_index: number; count: string }>(`
        SELECT option_index, COUNT(*)::int AS count FROM poll_votes WHERE poll_id = $1 GROUP BY option_index
      `, [pollRes.rows[0].id])
      const counts = pollRes.rows[0].options.map((_: string, i: number) => {
        const row = votesRes.rows.find((v: { option_index: number; count: string }) => v.option_index === i)
        return row ? Number(row.count) : 0
      })
      poll = {
        id: pollRes.rows[0].id,
        question: pollRes.rows[0].question,
        options: pollRes.rows[0].options,
        counts,
        total: counts.reduce((a: number, b: number) => a + b, 0),
      }
    }

    // ── Layout genérico (Fase 4) — N zonas editáveis, sobrepõe o template_key
    // antigo quando configurado. Compatibilidade: se nenhum layout_template_id
    // estiver definido, o comportamento antigo (fullscreen/magazine) continua
    // exatamente como está — nada muda pra quem não configurar isso.
    let layoutZones: Array<{ id: string; x: number; y: number; w: number; h: number; content_type: string }> | null = null
    const layoutRes = await pool.query<{ zones: any }>(`
      SELECT lt.zones
      FROM screen_templates st
      JOIN layout_templates lt ON lt.id = st.layout_template_id
      WHERE st.client_code = $1 AND st.active = true
      ORDER BY st.screen_id NULLS LAST
      LIMIT 1
    `, [upperCode])
    if (layoutRes.rows[0]) {
      layoutZones = layoutRes.rows[0].zones
      // Widgets de dado (clima/bolsa/notícias) usados por qualquer zona desse
      // tipo reaproveitam a mesma config de localização/tickers do template
      if (layoutZones?.some(z => ["weather", "stocks", "news"].includes(z.content_type)) && !widgets) {
        widgets = await fetchWidgetsData(template)
      }
    }

    // Fase 10 — slide-layout dentro do Institucional (não mais layout de
    // página) também pode ter zonas de clima/bolsa/notícias. Sem isso, essas
    // zonas ficavam pretas sempre que a tela não estivesse em modo Magazine.
    if (!widgets && institutional.some(m => m.layoutZones?.some((z: any) => ["weather", "stocks", "news"].includes(z.content_type)))) {
      widgets = await fetchWidgetsData(template)
    }

    return {
      name: rows[0]?.name ?? "DOOHPLAY",
      business_type: rows[0]?.business_type ?? "",
      primary_color: rows[0]?.primary_color ?? "#3B82F6",
      audio_enabled: rows[0]?.audio_enabled ?? false,
      medias: [...ownAndAds, ...network, ...institutional, ...realAds],
      template: template?.template_key || "fullscreen",
      transitionEffect: template?.transition_effect || "fade",
      widgetLayoutMode: template?.widget_layout_mode || "fixed",
      // Fase 43: onde o painel aparece — lateral direita (padrão, idêntico
      // ao comportamento de sempre), lateral esquerda ou faixa inferior.
      widgetPosition: template?.widget_position || "lateral_right",
      widgets,
      layoutZones,
      poll,
      // Fase 45 (16/08/2026): "TV 3.0 Ready" — ver
      // app/player/dtv/detectReceiver.ts e docs/dtv-ready-mvp-plano.md.
      // dtvReady é sempre false por padrão; ausência da flag NUNCA muda
      // comportamento existente do player.
      dtvReady: dtvStatus.connected,
    }
  } catch (err) {
    console.error("[player/page getPlayerData] erro ao buscar dados, devolvendo tela vazia:", err)
    return { name: "DOOHPLAY", business_type: "", primary_color: "#3B82F6", audio_enabled: false, medias: [] as PlayerMedia[], template: "fullscreen", transitionEffect: "fade", widgetLayoutMode: "fixed", widgetPosition: "lateral_right", widgets: null as any, layoutZones: null as any, poll: null as any, dtvReady: false }
  }
}

export const metadata = {
  title: "DOOHPLAY Player",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string; preview?: string }>
}) {
  const { screen, preview } = await searchParams
  const code = screen?.toUpperCase() ?? ""
  const isPreview = preview === "1"
  const data = await getPlayerData(code)

  function escapeHtml(s: string) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  const slidesHtml = data.medias.map((m: PlayerMedia, i: number) => {
    const cls = `slide${i === 0 ? " active" : ""}`
    const inner = m.type === "video"
      ? `<video src="${escapeHtml(m.url)}" autoplay muted playsinline></video>`
      : `<img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.name)}" />`
    // Fase 29 (20/07/2026): transição por slide, não mais uma só pra tela
    // inteira. m.transitionEffect vem do CampaignMedia (dono escolheu pra
    // aquele vídeo/imagem específico); sem escolha própria, cai no padrão
    // da tela (data.transitionEffect, screen_templates) — mesmo
    // comportamento de antes pra quem nunca configurou nada.
    const slideTransition = m.transitionEffect || data.transitionEffect
    return `<div class="${cls}" data-duration="${m.duration}" data-id="${escapeHtml(m.id)}" data-transition="${escapeHtml(slideTransition)}">${inner}</div>`
  }).join("")

  const qrFooterHtml = code
    ? `<div id="qr-footer"><img src="/api/qrcode/${escapeHtml(code)}" alt="QR code" /><span class="qr-label">Receba novidades</span></div>`
    : ""

  // ── Widgets de dado (Fase 4b — redesign) ────────────────────────────────
  // Design "painel de transmissão": números em fonte monoespaçada tabular
  // (relógio, temperatura, cotação) pra não "pular" quando o dígito muda,
  // ícones SVG próprios (emoji renderiza mal e inconsistente em TV Android),
  // e uma barra de destaque fina em cada card, como um chyron de telejornal.
  // Um único gerador, usado tanto no template "magazine" quanto nas zonas
  // genéricas — antes existiam duas versões quase idênticas.
  function weatherIconSvg(code: number) {
    const strokeProps = `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`
    if (code === 0 || code === 1) return `<svg viewBox="0 0 48 48" ${strokeProps}><circle cx="24" cy="24" r="9"/><path d="M24 3v6M24 39v6M3 24h6M39 24h6M9.5 9.5l4.2 4.2M34.3 34.3l4.2 4.2M9.5 38.5l4.2-4.2M34.3 13.7l4.2-4.2"/></svg>`
    if (code === 2) return `<svg viewBox="0 0 48 48" ${strokeProps}><circle cx="18" cy="18" r="7"/><path d="M18 4v4M32 18h4M27.5 7.5l-2.8 2.8M8.5 27.5l2.8-2.8"/><path d="M14 33a7 7 0 0 1 1-13.9A9 9 0 0 1 32 24.5a6 6 0 0 1-1 12.4H14z"/></svg>`
    if (code === 3) return `<svg viewBox="0 0 48 48" ${strokeProps}><path d="M13 34a8 8 0 0 1 1-16 10 10 0 0 1 19.5 3A7 7 0 0 1 33 34H13z"/></svg>`
    if (code === 45) return `<svg viewBox="0 0 48 48" ${strokeProps}><path d="M8 18h24M8 24h32M8 30h24M14 36h20"/></svg>`
    if ([51, 61, 63, 80].includes(code)) return `<svg viewBox="0 0 48 48" ${strokeProps}><path d="M12 26a8 8 0 0 1 1-16 10 10 0 0 1 19.5 3A7 7 0 0 1 32 26H12z"/><path d="M16 32v4M24 32v6M32 32v4"/></svg>`
    if (code === 95) return `<svg viewBox="0 0 48 48" ${strokeProps}><path d="M12 22a8 8 0 0 1 1-16 10 10 0 0 1 19.5 3A7 7 0 0 1 32 22H12z"/><path d="M25 26l-6 10h6l-4 8 10-12h-6z" fill="currentColor" stroke="none"/></svg>`
    return `<svg viewBox="0 0 48 48" ${strokeProps}><circle cx="24" cy="24" r="9"/></svg>`
  }

  function renderWidgetHtml(contentType: string): string {
    if (contentType === "clock") {
      return `<div class="dw dw-clock">
        <div class="dw-accent"></div>
        <div class="dw-clock-ring"></div>
        <div class="dw-clock-time" data-live-clock-time>--:--</div>
        <div class="dw-clock-date" data-live-clock-date>—</div>
      </div>`
    }
    if (contentType === "weather" && data.widgets?.weather) {
      const w = data.widgets.weather
      return `<div class="dw dw-weather">
        <div class="dw-accent"></div>
        <div class="dw-weather-icon">${weatherIconSvg(w.code ?? 0)}</div>
        <div class="dw-weather-temp">${w.temperature}<span>°C</span></div>
        <div class="dw-weather-label">${escapeHtml(w.label)}</div>
        <div class="dw-weather-location">${escapeHtml(w.location)}</div>
        <div class="dw-weather-grid">
          <div class="dw-weather-grid-item"><span class="dw-weather-grid-label">Sensação</span><span class="dw-weather-grid-value">${w.feelsLike}°</span></div>
          <div class="dw-weather-grid-item"><span class="dw-weather-grid-label">Umidade</span><span class="dw-weather-grid-value">${w.humidity}%</span></div>
          <div class="dw-weather-grid-item"><span class="dw-weather-grid-label">Vento</span><span class="dw-weather-grid-value">${w.windSpeed}km/h</span></div>
        </div>
      </div>`
    }
    if (contentType === "stocks" && data.widgets?.stocks?.length) {
      return `<div class="dw dw-stocks">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-stocks"></span>BOLSA · B3</div>
        <div class="dw-stocks-list">
          ${data.widgets.stocks.map((s: any) => `<div class="dw-stock-row">
            <span class="dw-stock-symbol">${escapeHtml(s.symbol)}</span>
            <span class="dw-stock-price">R$ ${Number(s.price ?? 0).toFixed(2)}</span>
            <span class="dw-stock-change ${(s.changePercent ?? 0) >= 0 ? "up" : "down"}">${(s.changePercent ?? 0) >= 0 ? "▲" : "▼"} ${Math.abs(s.changePercent ?? 0).toFixed(1)}%</span>
          </div>`).join("")}
        </div>
      </div>`
    }
    if (contentType === "poll" && data.poll) {
      const p = data.poll
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doohplay.com.br"
      const voteUrl = `${baseUrl}/enquete/${p.id}`
      const qrSrc = `/api/qrcode/url?u=${encodeURIComponent(voteUrl)}`
      return `<div class="dw dw-poll" data-poll-id="${escapeHtml(p.id)}">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-poll"></span>ENQUETE · AO VIVO</div>
        <div class="dw-poll-body">
          <div class="dw-poll-main">
            <div class="dw-poll-question">${escapeHtml(p.question)}</div>
            <div class="dw-poll-bars" data-poll-bars>
              ${p.options.map((opt: string, i: number) => {
                const count = p.counts[i] ?? 0
                const pct = p.total > 0 ? Math.round((count / p.total) * 100) : 0
                return `<div class="dw-poll-row">
                  <div class="dw-poll-row-label"><span>${escapeHtml(opt)}</span><span class="dw-poll-pct" data-poll-pct="${i}">${pct}%</span></div>
                  <div class="dw-poll-track"><div class="dw-poll-fill" data-poll-fill="${i}" style="width:${pct}%"></div></div>
                </div>`
              }).join("")}
            </div>
            <div class="dw-poll-total" data-poll-total>${p.total} voto${p.total === 1 ? "" : "s"}</div>
          </div>
          <div class="dw-poll-qr">
            <img src="${qrSrc}" alt="QR code da enquete" />
            <div class="dw-poll-qr-label">Aponte a câmera<br/>e vote</div>
          </div>
        </div>
      </div>`
    }
    if (contentType === "news" && data.widgets?.news?.length) {
      return `<div class="dw dw-news">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-news"></span>NOTÍCIAS · G1</div>
        <div class="dw-news-list">
          ${data.widgets.news.map((n: any) => `<div class="dw-news-item"><span class="dw-news-bar"></span><span>${escapeHtml(n.title)}</span></div>`).join("")}
        </div>
      </div>`
    }
    // Fase 39 (20/07/2026): mesmo padrão do "news", fonte de economia —
    // usado no widget combinado "bolsa revezando com mercado".
    if (contentType === "econnews" && data.widgets?.econNews?.length) {
      return `<div class="dw dw-news">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-news"></span>ECONOMIA · G1</div>
        <div class="dw-news-list">
          ${data.widgets.econNews.map((n: any) => `<div class="dw-news-item"><span class="dw-news-bar"></span><span>${escapeHtml(n.title)}</span></div>`).join("")}
        </div>
      </div>`
    }
    // Fase 43: câmbio — mesmo padrão visual de "stocks", com preço de
    // compra (bid) e variação percentual, via AwesomeAPI (sem token).
    if (contentType === "cambio" && data.widgets?.cambio?.length) {
      return `<div class="dw dw-stocks">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-stocks"></span>CÂMBIO</div>
        <div class="dw-stocks-list">
          ${data.widgets.cambio.map((c: any) => `<div class="dw-stock-row">
            <span class="dw-stock-symbol">${escapeHtml(c.name || (c.from + "/" + c.to))}</span>
            <span class="dw-stock-price">R$ ${Number(c.bid ?? 0).toFixed(2)}</span>
            <span class="dw-stock-change ${(c.pct ?? 0) >= 0 ? "up" : "down"}">${(c.pct ?? 0) >= 0 ? "▲" : "▼"} ${Math.abs(c.pct ?? 0).toFixed(1)}%</span>
          </div>`).join("")}
        </div>
      </div>`
    }
    // Fase 43: indicadores — Selic/CDI/IPCA(12m), direto do Banco Central
    // (séries 432/4389/13522, sem token).
    if (contentType === "indicadores" && data.widgets?.indicadores?.length) {
      return `<div class="dw dw-stocks">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-stocks"></span>INDICADORES</div>
        <div class="dw-stocks-list">
          ${data.widgets.indicadores.map((i: any) => `<div class="dw-stock-row">
            <span class="dw-stock-symbol">${escapeHtml(i.name || i.slug || "")}</span>
            <span class="dw-stock-price">${Number(i.value ?? 0).toFixed(2)}${escapeHtml(i.unit || "%")}</span>
          </div>`).join("")}
        </div>
      </div>`
    }
    // Fase 43: qualidade do ar — Open-Meteo (US AQI + PM2.5), sem token.
    if (contentType === "airquality" && data.widgets?.airQuality) {
      const aq = data.widgets.airQuality
      const label = aq.usAqi <= 50 ? "Boa" : aq.usAqi <= 100 ? "Moderada" : aq.usAqi <= 150 ? "Ruim p/ sensíveis" : "Ruim"
      return `<div class="dw dw-stocks">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-stocks"></span>QUALIDADE DO AR</div>
        <div class="dw-stocks-list">
          <div class="dw-stock-row"><span class="dw-stock-symbol">Índice (AQI)</span><span class="dw-stock-price">${aq.usAqi} · ${label}</span></div>
          <div class="dw-stock-row"><span class="dw-stock-symbol">PM2.5</span><span class="dw-stock-price">${aq.pm25} µg/m³</span></div>
        </div>
      </div>`
    }
    // Fase 43: loteria — último resultado da Mega-Sena (Caixa), sem token.
    if (contentType === "loteria" && data.widgets?.loteria) {
      const lo = data.widgets.loteria
      return `<div class="dw dw-stocks">
        <div class="dw-accent"></div>
        <div class="dw-header"><span class="dw-live-dot dw-live-dot-stocks"></span>${escapeHtml(lo.jogo)} · CONCURSO ${escapeHtml(String(lo.concurso))}</div>
        <div class="dw-stocks-list">
          <div class="dw-stock-row"><span class="dw-stock-price" style="font-size:1.6vh;letter-spacing:.05em;">${lo.dezenas.map(escapeHtml).join(" · ")}</span></div>
          <div class="dw-stock-row"><span class="dw-stock-symbol">${lo.acumulou ? "Acumulou" : "Teve ganhador"}</span></div>
        </div>
      </div>`
    }
    // Fase 43: relógio + clima num único card centralizado — usado como
    // cabeçalho fixo do "painel completo" (modelos 1/2/3), igual ao mockup
    // aprovado. Não entra no revezamento; fica sempre visível.
    if (contentType === "clockweather") {
      const w = data.widgets?.weather
      return `<div class="dw dw-clockweather">
        <div class="dw-clockweather-time" data-live-clock-time>--:--</div>
        ${w ? `<div class="dw-clockweather-weather">${weatherIconSvg(w.code ?? 0)}${w.temperature}°C ${escapeHtml(w.location)}</div>` : ""}
      </div>`
    }
    return ""
  }

  // Fase 43 (21/07/2026): "painel completo" — card único central revezando
  // entre até 8 telas de dado (bolsa, câmbio, indicadores, notícias,
  // economia, qualidade do ar, enquete ao vivo, loteria). Reaproveita os
  // mesmos cards ".dw" já usados no modo fixo — só filtra fora qualquer
  // fonte sem dado real (mesmo padrão de "sem dado, não mostra" do resto
  // do arquivo). O JS inline (comboCompletoCycle, mais abaixo) troca qual
  // desses fica visível a cada N segundos.
  function renderComboScreensHtml(): string[] {
    return ["stocks", "cambio", "indicadores", "news", "econnews", "airquality", "poll", "loteria"]
      .map(t => renderWidgetHtml(t))
      .filter(Boolean)
  }

  // Fase 39 (20/07/2026): widget combinado — dois widgets no MESMO espaço,
  // revezando (um visível de cada vez, com fade). Pedido do fundador:
  // "hora que troca como o clima", "bolsa revezando com mercado" — assuntos
  // afins compartilhando um card em vez de ocupar 2 cards fixos separados.
  // JS (comboCycle, mais abaixo no script inline) troca a visibilidade
  // sozinho a cada N segundos; aqui só monta os dois lados no HTML.
  function renderComboWidgetHtml(typeA: string, typeB: string, comboId: string): string {
    const htmlA = renderWidgetHtml(typeA)
    const htmlB = renderWidgetHtml(typeB)
    // Se um dos dois lados não tem dado real pra mostrar (ex: cliente sem
    // ticker configurado), não faz sentido revezar com espaço vazio —
    // mostra só o que existe, como widget normal.
    if (!htmlA && !htmlB) return ""
    if (!htmlA) return htmlB
    if (!htmlB) return htmlA
    return `<div class="dw-combo" data-combo-id="${comboId}">
      <div class="dw-combo-side active" data-combo-side="a">${htmlA}</div>
      <div class="dw-combo-side" data-combo-side="b">${htmlB}</div>
    </div>`
  }

  // Fase 40 (20/07/2026): modo "compacto" — inspirado em referência visual
  // (template-grid-retail.html, cabeçalho "Hoje: 28°C · 14:35"). Linha
  // única de texto, hora+clima juntos, em vez de 2 cards cheios revezando
  // (mais discreto, ocupa bem menos espaço vertical).
  function renderCompactBarHtml(): string {
    const w = data.widgets?.weather
    return `<div class="dw dw-compact-bar">
      <div class="dw-accent"></div>
      <span class="dw-compact-clock" data-live-clock-time>--:--</span>
      ${w ? `<span class="dw-compact-sep">·</span>
      <span class="dw-compact-weather">${weatherIconSvg(w.code ?? 0)}${w.temperature}°C ${escapeHtml(w.location)}</span>` : ""}
    </div>`
  }

  // Fase 40 (20/07/2026): ticker corrido — mesma fonte de notícia (G1),
  // mas rolando horizontalmente em vez de lista parada. Duplica o
  // conteúdo uma vez (mesmo texto 2x seguidas) pra o loop de CSS
  // (translateX -50%) ficar contínuo, sem "salto" visível no fim.
  function renderTickerHtml(): string {
    if (!data.widgets?.news?.length) return ""
    const items = data.widgets.news.map((n: any) => escapeHtml(n.title)).join("&nbsp;&nbsp;•&nbsp;&nbsp;")
    return `<div class="dw-ticker-wrap">
      <div class="dw-ticker-label">Ao vivo</div>
      <div class="dw-ticker-scroll">
        <div class="dw-ticker-track">
          <span class="dw-ticker-item">${items}</span>
          <span class="dw-ticker-item">${items}</span>
        </div>
      </div>
    </div>`
  }

  const bodyContentHtml = data.medias.length === 0
    ? `<div class="default-screen">
        <div class="logo-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div class="logo-text">DOOH<span>PLAY</span></div>
        <div class="tagline">${escapeHtml(data.name)}</div>
        <div class="screen-code">📺 ${escapeHtml(code)} — Aguardando conteúdo</div>
      </div>`
    : `<div id="slides">${slidesHtml}</div>`

  // Fase 43: posição do painel — bottom (Modelo 1) ou lateral (Modelo 2/3).
  // Só muda a classe wrapper (CSS cuida do resto); o conteúdo interno dos
  // modos existentes (fixed/revezando/compacto) não muda em nada.
  const widgetPositionClass = data.widgetPosition === "bottom" ? "widgets-position-bottom" : "widgets-position-lateral"

  const comboScreensHtml = data.widgetLayoutMode === "painel_completo" ? renderComboScreensHtml() : []
  const comboScreensJson = JSON.stringify(comboScreensHtml)

  const widgetsPanelHtml = data.template === "magazine" && data.widgets
    ? (data.widgetLayoutMode === "painel_completo"
        ? `<div id="widgets-panel" class="widgets-painel-completo ${widgetPositionClass}">
            ${renderWidgetHtml("clockweather")}
            <div class="dw dw-combo-shell"><div class="combo-inner" id="combo-completo-inner"></div></div>
            <div class="dw-logo-block">DOOH<span class="accent">PLAY</span></div>
          </div>`
        : data.widgetLayoutMode === "revezando"
        ? `<div id="widgets-panel" class="${widgetPositionClass}">
            ${renderComboWidgetHtml("clock", "weather", "clima-hora")}
            ${renderComboWidgetHtml("stocks", "econnews", "bolsa-mercado")}
          </div>`
        : data.widgetLayoutMode === "compacto"
        ? `<div id="widgets-panel" class="widgets-compact ${widgetPositionClass}">
            ${renderCompactBarHtml()}
            ${renderWidgetHtml("stocks")}
            ${renderTickerHtml()}
          </div>`
        : `<div id="widgets-panel" class="${widgetPositionClass}">
            ${renderWidgetHtml("clock")}
            ${renderWidgetHtml("weather")}
            ${renderWidgetHtml("stocks")}
            ${renderWidgetHtml("news")}
          </div>`)
    : ""

  // ── Layout genérico de N zonas (Fase 4) ─────────────────────────────────
  // Extraído em função reutilizável (Fase 9) — o mesmo gerador agora serve
  // tanto pro layout fixo de página quanto pra um "slide-layout" dentro da
  // playlist normal (item de tipo 'layout' misturado com os outros).
  function renderZonesHtml(zones: Array<{ id: string; x: number; y: number; w: number; h: number; content_type: string }>): string {
    return zones.map((z) => {
      const inner = ["weather", "stocks", "news", "clock", "poll"].includes(z.content_type)
        ? (renderWidgetHtml(z.content_type) || `<div class="zone-media"></div>`)
        : `<div class="zone-media"></div>`
      return `<div class="zone" data-zone-id="${escapeHtml(z.id)}" data-content-type="${escapeHtml(z.content_type)}" style="position:absolute;left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;">
        <div class="zone-card">${inner}</div>
      </div>`
    }).join("")
  }

  // Só entra em ação quando um layout_template está configurado pra esse
  // cliente. Sem isso, o player continua 100% no caminho antigo (fullscreen
  // ou magazine) — zero mudança de comportamento pra quem não configurou.
  const zonesHtml = data.layoutZones ? renderZonesHtml(data.layoutZones) : ""

  // Fase 43: roteia o painel de widgets pra zona certa conforme
  // widget_position — bottom (Modelo 1) vai pro #bottom-zone, lateral_left
  // e lateral_right (Modelos 2/3) vão pro #lateral-zone. A zona que NÃO
  // recebe o painel fica vazia, livre pro zoom de anúncio dinâmico (Fase
  // 33) ocupar em runtime — ver widgetsInLateral/widgetsInBottom no script
  // inline. Modelo 3 (lateral esquerda) inverte a ORDEM real no DOM
  // (#lateral-zone antes de #main-zone) — como #content-row é flex row
  // sem "order" explícito, isso já basta pra jogar o painel pra esquerda;
  // #main-zone/#lateral-zone continuam com os mesmos ids, então nenhuma
  // lógica JS (que usa getElementById) precisa saber a ordem.
  const isBottomWidgets = data.widgetPosition === "bottom"
  const isLeftWidgets = data.widgetPosition === "lateral_left"
  const mainZoneHtml = `<div id="main-zone"><div id="content-area">${bodyContentHtml}</div><div id="floating-zone"></div></div>`
  const lateralZoneHtml = `<div id="lateral-zone">${isBottomWidgets ? "" : widgetsPanelHtml}</div>`
  const bottomZoneHtml = `<div id="bottom-zone">${isBottomWidgets ? widgetsPanelHtml : ""}</div>`
  const contentRowInnerHtml = isLeftWidgets ? `${lateralZoneHtml}${mainZoneHtml}` : `${mainZoneHtml}${lateralZoneHtml}`

  const playerInnerHtml = data.layoutZones
    ? `<div id="progress-bar"></div><div id="heartbeat"></div>${qrFooterHtml}<div id="zones-root" style="position:relative;width:100%;height:100%;">${zonesHtml}</div>`
    : `<div id="progress-bar"></div><div id="heartbeat"></div>${qrFooterHtml}<div id="content-row">${contentRowInnerHtml}</div>${bottomZoneHtml}`

  // Slides do tipo 'layout' (Fase 9) — a composição de N-zonas é
  // pré-renderizada aqui no servidor (reaproveitando renderZonesHtml, o
  // mesmo gerador do layout de página inteira), pra o JS do cliente só
  // precisar injetar o HTML pronto quando a vez desse slide chegar na
  // rotação normal, sem duplicar a lógica de zona no navegador.
  const mediasWithLayoutHtml = data.medias.map((m: any) =>
    m.type === "layout" && m.layoutZones
      ? { ...m, layoutHtml: renderZonesHtml(m.layoutZones) }
      : m
  )
  const mediasJson = JSON.stringify(mediasWithLayoutHtml)
  const buildVersion = process.env.RENDER_GIT_COMMIT || "dev"

  return (
    <>
      <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100vw; height: 100vh;
            background: #000;
            overflow: hidden;
            font-family: 'Inter', system-ui, sans-serif;
          }
          /* Fonte auto-hospedada (Fase 5) — arquivo servido do próprio
             domínio, sem depender de Google Fonts em runtime. TVs com
             internet instável não podem travar esperando uma fonte externa. */
          @font-face {
            font-family: 'Space Grotesk';
            src: url('/fonts/space-grotesk-latin-400-normal.woff2') format('woff2');
            font-weight: 400; font-style: normal; font-display: swap;
          }
          @font-face {
            font-family: 'Space Grotesk';
            src: url('/fonts/space-grotesk-latin-600-normal.woff2') format('woff2');
            font-weight: 600; font-style: normal; font-display: swap;
          }
          @font-face {
            font-family: 'Space Grotesk';
            src: url('/fonts/space-grotesk-latin-700-normal.woff2') format('woff2');
            font-weight: 700; font-style: normal; font-display: swap;
          }
          .font-display { font-family: 'Space Grotesk', system-ui, sans-serif; }

          #player {
            width: 100vw; height: 100vh;
            position: relative;
            background: #0F172A;
            display: flex;
            flex-direction: column;
          }
          /* Fase 30 (20/07/2026): tint sutil de fundo por horário do dia
             (manhã/tarde/entardecer/noite) — aditivo, não mexe em
             --accent-1/--accent-2 (esses continuam 100% controlados pelo
             motor "Aurora", marca+conteúdo, Fase 5). Só um overlay de cor
             de baixíssima opacidade atrás de tudo, puramente decorativo. */
          #player::before {
            content: '';
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background: radial-gradient(ellipse 120% 80% at 15% 0%, var(--daytint-color, transparent), transparent 55%);
            opacity: var(--daytint-opacity, 0);
            transition: opacity 2.5s ease, background 2.5s ease;
          }
          /* Fase 33 (20/07/2026): #player virou coluna (era linha) pra caber
             o #bottom-zone novo, embaixo de tudo. #content-row é a antiga
             estrutura de linha (main+lateral), agora um nível abaixo —
             comportamento idêntico ao de antes pra quem só usa lateral. */
          #content-row {
            position: relative;
            flex: 1 1 auto;
            min-height: 0;
            width: 100%;
            display: flex;
            flex-direction: row;
          }
          /* ── Compositor de zonas (Fase 3) ──────────────────────────────
             #main-zone é o conteúdo de sempre (fullscreen), agora dentro de
             um container flex em vez de ocupar o #player inteiro. Quando
             existe conteúdo "encolhe lateral" ativo, #player abre
             #lateral-zone do lado.
             Sem nenhum item shrink_lateral e sem painel de widgets,
             comportamento é IDÊNTICO ao fullscreen de sempre — largura de
             #lateral-zone fica em 0.
             Fase 43 (21/08/2026): a classe .has-lateral era ÚNICA,
             compartilhada entre o painel de widgets estático (server-side,
             template magazine) e o zoom de anúncio dinâmico (Fase 33,
             JS runtime) — os dois setavam/removiam a MESMA classe, o que
             colidia sempre que os dois tentassem existir ao mesmo tempo.
             Separado em duas classes independentes que controlam a MESMA
             largura via seletor combinado (:is não usado de propósito —
             suporte mais amplo em WebViews antigas de Fire Stick/Android
             TV): .has-lateral-widgets (setada no server, permanente
             enquanto o painel estiver nessa posição) e .has-lateral-ad-zoom
             (setada/removida pelo JS, ver showLateralSlide). */
          #main-zone {
            position: relative;
            flex: 1 1 auto;
            height: 100%;
            min-width: 0;
            transition: flex-basis .5s ease;
          }
          /* Cantos tipo viewfinder — só aparecem quando há painel lateral,
             reforçando a sensação de "transmissão ao vivo" ao lado dos dados */
          #main-zone::before, #main-zone::after {
            content: ''; position: absolute; width: 28px; height: 28px;
            border-color: var(--accent-1, #00D9FF); opacity: 0; z-index: 5;
            transition: opacity .6s ease, border-color 1.4s ease; pointer-events: none;
          }
          #main-zone::before { top: 20px; left: 20px; border-top: 2px solid; border-left: 2px solid; }
          #main-zone::after  { top: 20px; right: 20px; border-top: 2px solid; border-right: 2px solid; }
          #player.has-lateral-widgets #main-zone::before,
          #player.has-lateral-widgets #main-zone::after,
          #player.has-lateral-ad-zoom #main-zone::before,
          #player.has-lateral-ad-zoom #main-zone::after { opacity: .8; }
          #lateral-zone {
            position: relative;
            width: 0;
            height: 100%;
            overflow: hidden;
            flex-shrink: 0;
            background: #000;
            transition: width .5s ease;
          }
          #player.has-lateral-widgets #lateral-zone,
          #player.has-lateral-ad-zoom #lateral-zone {
            width: 26vw;
          }
          #lateral-zone video, #lateral-zone img {
            width: 100%; height: 100%;
            object-fit: cover;
            display: none;
          }

          /* Fase 33 (20/07/2026): faixa inferior — mesmo padrão do lateral,
             só que reduz ALTURA de #content-row em vez de largura de
             #main-zone. Sem nenhum item banner_bottom e sem painel de
             widgets nessa posição, comportamento idêntico a antes (altura
             0). Fase 43: mesma separação de classes do lateral — ver
             comentário acima de #main-zone. */
          #bottom-zone {
            position: relative;
            width: 100%;
            height: 0;
            overflow: hidden;
            flex-shrink: 0;
            background: #000;
            transition: height .5s ease;
          }
          #player.has-bottom-banner-widgets #bottom-zone,
          #player.has-bottom-banner-ad-zoom #bottom-zone {
            height: 16vh;
          }
          #bottom-zone video, #bottom-zone img {
            width: 100%; height: 100%;
            object-fit: cover;
            display: none;
          }

          /* Fase 33 (20/07/2026): flutuante — ao contrário de lateral/faixa,
             NÃO reduz o conteúdo principal. Aparece por cima, periodicamente,
             sem interromper a rotação de baixo (JS liga/desliga a opacidade
             e o deslocamento; a rotação principal continua tocando atrás,
             sem pausar). Canto inferior direito, como um "bug" de canal de
             TV — familiar, discreto, não tampa o centro da tela. */
          #floating-zone {
            position: absolute;
            right: 3vw; bottom: 3vh;
            width: 22vw; height: 22vh;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,.45);
            border: 2px solid rgba(255,255,255,.15);
            opacity: 0;
            transform: translateY(16px);
            pointer-events: none;
            transition: opacity .5s ease, transform .5s ease;
            z-index: 8;
            background: #000;
          }
          #floating-zone.visible {
            opacity: 1;
            transform: translateY(0);
          }
          #floating-zone video, #floating-zone img {
            width: 100%; height: 100%;
            object-fit: cover;
            display: none;
          }

          /* Fase 40 (20/07/2026): selo "Patrocinado" — pedido do fundador
             (referência: mockup "template-hero-ads.html"), transparência de
             que o conteúdo daquela zona é anúncio pago, não institucional/
             conteúdo do dono. JS alterna a classe .has-sponsor-badge
             conforme a categoria do item que está tocando ali no momento —
             o selo só existe quando a classe está presente. */
          #lateral-zone.has-sponsor-badge::after,
          #bottom-zone.has-sponsor-badge::after,
          #floating-zone.has-sponsor-badge::after {
            content: 'Patrocinado';
            position: absolute;
            top: 10px; right: 10px;
            background: rgba(0,0,0,.65);
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: .02em;
            padding: 4px 10px;
            border-radius: 6px;
            z-index: 6;
            pointer-events: none;
          }

          /* ── Painel de widgets (Fase 3b: template magazine) ── */
          #widgets-panel {
            position: relative;
            width: 100%; height: 100%;
            display: flex; flex-direction: column;
            padding: 1.6vh 1.1vw;
            gap: 1.2vh;
            overflow: hidden;
            /* Fase 41 (21/07/2026): fundo deixava de ser preto liso e sem
               hierarquia — achado real em uso (print de tela real). Usa a
               mesma cor de marca do motor Aurora (--accent-1/--accent-2,
               já calculada por sc.primary_color + extração de cor do
               conteúdo) como um wash sutil de fundo, em vez de #000 puro. */
            background: #05070D;
          }
          #widgets-panel::before {
            content: '';
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background: linear-gradient(165deg, var(--accent-1, #3B82F6), transparent 65%);
            opacity: .16;
            transition: background 1.4s ease;
          }
          #widgets-panel > * { position: relative; z-index: 1; }

          /* Fase 39 (20/07/2026): widget combinado — dois lados no mesmo
             espaço (mesmo flex: 1 do widget normal), revezando com fade.
             JS (comboCycle) alterna a classe .active a cada intervalo. */
          .dw-combo {
            position: relative;
            flex: 1;
            min-height: 0;
          }
          .dw-combo-side {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 1s ease;
            pointer-events: none;
          }
          .dw-combo-side.active {
            opacity: 1;
            pointer-events: auto;
          }
          /* O widget dentro do combo ocupa 100% do espaço do lado (antes
             era flex:1 dentro de uma coluna — aqui vira position:absolute) */
          .dw-combo-side .dw {
            position: absolute;
            inset: 0;
          }

          /* Fase 42 (21/07/2026): reformulação — feedback direto em uso
             real ("ainda não está bom"): o ticker em bloco de cor sólida
             destoava dos outros 2 cards (vidro fosco discreto), e sobrava
             espaço vazio preto embaixo. Agora os 3 elementos são da MESMA
             família visual (vidro + faixa de destaque na cor de marca), e
             o ticker cresce (flex:1) pra preencher o espaço que sobrar,
             em vez de deixar vazio. */
          #widgets-panel.widgets-compact {
            justify-content: flex-start;
            gap: 1.6vh;
          }
          #widgets-panel.widgets-compact .dw {
            flex: 0 0 auto;
            height: auto;
          }

          /* Fase 43 (21/08/2026): Modelo 1 — o painel vira uma barra
             horizontal (largura toda, altura do #bottom-zone) em vez de
             coluna vertical. Aplica em cima de qualquer widgetLayoutMode,
             não só painel_completo — quem escolher "fixed" ou "revezando"
             na faixa inferior também ganha o flip de eixo. */
          #widgets-panel.widgets-position-bottom {
            flex-direction: row;
            align-items: stretch;
          }
          #widgets-panel.widgets-position-bottom > * {
            flex: 1;
            min-width: 0;
          }

          /* ── Painel completo (Fase 43) — card único central revezando
             entre até 8 fontes de dado, com relógio+clima e logo fixos
             nas pontas. Layout dos mockups modelo-1/2/3 aprovados. ── */
          .widgets-painel-completo {
            gap: 1vh;
          }
          .widgets-painel-completo.widgets-position-bottom {
            gap: .8vw;
          }
          .dw-clockweather {
            flex: 0 0 auto;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center;
            padding: 1.4vh 1.2vw;
            border-radius: 14px;
            background: linear-gradient(155deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,.09);
          }
          .widgets-position-bottom .dw-clockweather {
            min-width: 12vw;
          }
          .dw-clockweather-time {
            font-size: 3.2vh; font-weight: 800; letter-spacing: -.01em;
            font-variant-numeric: tabular-nums;
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
          }
          .dw-clockweather-weather {
            margin-top: .6vh; font-size: 1.5vh; font-weight: 600; opacity: .85;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          }
          .dw-clockweather-weather svg { width: 1.8vh; height: 1.8vh; flex-shrink: 0; }

          .dw-combo-shell {
            position: relative;
            flex: 1; min-height: 0; min-width: 0;
            display: flex; flex-direction: column; justify-content: center;
            padding: 1.4vh 1.2vw;
            border-radius: 14px;
            background: linear-gradient(155deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,.09);
            border-left: 4px solid var(--accent-1, #3B82F6);
            overflow: hidden;
            transition: border-color 1.4s ease;
          }
          .widgets-position-bottom .dw-combo-shell {
            border-left: none;
            border-top: 4px solid var(--accent-1, #3B82F6);
          }
          .combo-inner {
            width: 100%;
            transition: opacity 1.2s ease;
          }
          /* O card revezado (renderWidgetHtml) já vem com o próprio
             fundo/borda/accent (é o mesmo ".dw" usado nos outros modos) —
             aqui dentro do shell isso duplicaria o "vidro" (card dentro de
             card). Neutraliza o estilo próprio do card interno, deixando
             só o conteúdo (header + linhas), já que o shell é quem dá o
             fundo/borda dessa vez. */
          .combo-inner .dw {
            position: static;
            width: 100%; height: auto;
            padding: 0; margin: 0;
            background: none; backdrop-filter: none; border: none;
            border-radius: 0;
          }
          .combo-inner .dw-accent { display: none; }

          .dw-logo-block {
            flex: 0 0 auto;
            display: flex; align-items: center; justify-content: center;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 1.6vh; font-weight: 800; letter-spacing: -.01em;
            opacity: .85;
            padding: 0 .6vw;
          }
          .dw-logo-block .accent { color: var(--accent-1, #3B82F6); }

          .dw-compact-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 2vh 1.3vw !important;
            font-family: 'Space Grotesk', 'Inter', sans-serif;
            font-variant-numeric: tabular-nums;
          }
          .dw-compact-clock {
            font-size: 4.2vh;
            font-weight: 800;
            letter-spacing: -.01em;
          }
          .dw-compact-sep { opacity: .35; font-size: 2.2vh; }
          .dw-compact-weather {
            display: flex; align-items: center; gap: 8px;
            font-size: 2.2vh; font-weight: 600; opacity: .95;
          }
          .dw-compact-weather svg { width: 2.8vh; height: 2.8vh; }

          /* Ticker corrido — agora um card de vidro igual aos outros
             (mesmo fundo/blur/borda do .dw base), com faixa de destaque
             na LATERAL (em vez de topo, pra diferenciar visualmente sem
             perder a família) e rótulo fixo "AO VIVO" que não rola —
             só o texto da notícia mesmo rola, como ticker de telejornal
             de verdade (Bloomberg/CNBC usam esse padrão: fundo escuro,
             faixa de cor, texto claro — nunca bloco de cor sólida cheio). */
          .dw-ticker-wrap {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            overflow: hidden;
            background: linear-gradient(155deg, rgba(255,255,255,.06), rgba(255,255,255,.015));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,.08);
            border-left: 4px solid var(--accent-1, #3B82F6);
            border-radius: 14px;
            padding: 0 1.3vw;
            white-space: nowrap;
            transition: border-color 1.4s ease;
          }
          .dw-ticker-label {
            flex-shrink: 0;
            display: flex; align-items: center; gap: 6px;
            font-size: 1.3vh; font-weight: 700; letter-spacing: .1em;
            text-transform: uppercase;
            color: var(--accent-1, #3B82F6);
            transition: color 1.4s ease;
          }
          .dw-ticker-label::before {
            content: ''; width: 7px; height: 7px; border-radius: 50%;
            background: currentColor;
            animation: dwTickerPulse 2s ease-in-out infinite;
          }
          @keyframes dwTickerPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
          .dw-ticker-scroll { flex: 1; overflow: hidden; min-width: 0; }
          .dw-ticker-track {
            display: inline-flex;
            animation: dwTickerScroll 28s linear infinite;
          }
          .dw-ticker-item {
            padding-right: 4vw;
            font-size: 2.2vh;
            font-weight: 600;
            color: #F5F7FA;
            font-family: 'Inter', sans-serif;
          }
          @keyframes dwTickerScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }

          /* ── Layout genérico de N zonas (Fase 4) ── */
          #zones-root { background: #1E293B; }
          .zone { background: transparent; }
          .zone-card {
            position: absolute;
            inset: 8px;
            background: #05070D;
            border-radius: 16px;
            overflow: hidden;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,.10);
          }
          .zone-media { width: 100%; height: 100%; position: relative; }
          .zone-media video, .zone-media img {
            width: 100%; height: 100%; object-fit: cover; display: none;
          }
          /* Ken Burns sutil só em imagens — mesmo tratamento do caminho antigo */
          .zone-media img { animation: dw-kenburns 18s ease-in-out infinite alternate; }
          /* Cantos tipo viewfinder na zona principal, reforça "ao vivo"
             já que aqui sempre tem pelo menos um bloco de dado ao lado */
          .zone[data-content-type="main_rotation"] .zone-card {
            position: absolute;
          }
          .zone[data-content-type="main_rotation"] .zone-card::before,
          .zone[data-content-type="main_rotation"] .zone-card::after {
            content: ''; position: absolute; width: 22px; height: 22px;
            border-color: var(--accent-1, #00D9FF); opacity: .8; z-index: 5;
            transition: border-color 1.4s ease; pointer-events: none;
          }
          .zone[data-content-type="main_rotation"] .zone-card::before { top: 14px; left: 14px; border-top: 2px solid; border-left: 2px solid; }
          .zone[data-content-type="main_rotation"] .zone-card::after  { top: 14px; right: 14px; border-top: 2px solid; border-right: 2px solid; }

          /* ── Sistema de widgets "Aurora" (Fase 5) ──────────────────────────
             Substitui o chyron de cor fixa por tipo (Fase 4b) por um único
             gradiente dinâmico, controlado pelo motor de cor (marca do
             cliente + cor extraída do conteúdo em exibição). Números em
             fonte monoespaçada tabular, ícones SVG próprios. */
          .dw {
            position: relative;
            width: 100%; height: 100%;
            display: flex; flex-direction: column; justify-content: center;
            padding: 1.8vh 1.1vw;
            border-radius: 14px;
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            color: #F5F7FA;
            background: linear-gradient(155deg, rgba(255,255,255,.05), rgba(255,255,255,.015));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,.07);
            overflow: hidden;
          }
          .dw-accent {
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, var(--accent-1, #00D9FF), var(--accent-2, #7B61FF));
            box-shadow: 0 0 16px 1px rgba(var(--bg-tint, 0,217,255), .6);
            transition: background 1.4s ease, box-shadow 1.4s ease;
          }

          .dw-header {
            display: flex; align-items: center; gap: 8px;
            font-size: 1.4vh; font-weight: 700; letter-spacing: .12em;
            opacity: .5; margin-bottom: 1.2vh; text-transform: uppercase;
          }
          .dw-live-dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
            animation: dw-pulse 2s ease-in-out infinite;
          }
          .dw-live-dot-stocks { background: #34D399; }
          .dw-live-dot-news { background: #FB7185; }
          @keyframes dw-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: .3; transform: scale(.7); }
          }

          /* Relógio — elemento hero, com anel de brilho que "respira" */
          .dw-clock { align-items: center; text-align: center; }
          .dw-clock-ring {
            position: absolute; width: 160%; height: 160%; border-radius: 50%;
            background: radial-gradient(circle, rgba(var(--bg-tint, 0,217,255),.20), transparent 70%);
            animation: dw-breathe 6s ease-in-out infinite;
            transition: background 1.4s ease;
          }
          @keyframes dw-breathe { 0%,100% { opacity:.5; transform: scale(1);} 50% { opacity:.9; transform: scale(1.05);} }
          .dw-clock-time {
            position: relative;
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
            font-size: 8vh; font-weight: 700; line-height: 1; letter-spacing: -.01em;
          }
          .dw-clock-date {
            position: relative;
            font-size: 1.6vh; opacity: .55; margin-top: 1vh; letter-spacing: .06em; text-transform: uppercase;
          }

          /* Clima — ícone mantém dourado (associação intuitiva sol=quente) */
          .dw-weather { align-items: center; text-align: center; }
          .dw-weather-icon { width: 8vh; height: 8vh; color: #FFB454; }
          .dw-weather-icon svg { width: 100%; height: 100%; }
          .dw-weather-temp {
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
            font-size: 6.2vh; font-weight: 700; line-height: 1; margin-top: .5vh;
          }
          .dw-weather-temp span { font-size: .5em; opacity: .6; font-weight: 500; }
          .dw-weather-label { font-size: 1.8vh; opacity: .75; margin-top: .5vh; }
          .dw-weather-location {
            font-size: 1.2vh; opacity: .4; margin-top: 1vh;
            letter-spacing: .12em; text-transform: uppercase;
          }
          /* Fase 30 (20/07/2026): grid de detalhe do clima (sensação/
             umidade/vento) — mesmo padrão visual dos outros widgets, só
             menor e em 3 colunas, com uma linha divisória sutil por cima. */
          .dw-weather-grid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 0.4vw; width: 100%; margin-top: 1.6vh; padding-top: 1.4vh;
            border-top: 1px solid rgba(255,255,255,.08);
          }
          .dw-weather-grid-item { display: flex; flex-direction: column; align-items: center; }
          .dw-weather-grid-label {
            font-size: 1vh; opacity: .45; text-transform: uppercase;
            letter-spacing: .08em; margin-bottom: .3vh;
          }
          .dw-weather-grid-value {
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
            font-size: 1.7vh; font-weight: 600;
          }

          /* Bolsa — verde/rosa semânticos (alta/baixa), não seguem o tema dinâmico */
          .dw-stocks-list { display: flex; flex-direction: column; }
          .dw-stock-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.3vh 0; font-size: 2.3vh;
            border-bottom: 1px solid rgba(255,255,255,.06);
          }
          .dw-stock-row:last-child { border-bottom: none; }
          .dw-stock-symbol { font-weight: 700; letter-spacing: .02em; }
          .dw-stock-price {
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
          }
          .dw-stock-change {
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums;
            font-size: 1.7vh; font-weight: 700; padding: 4px 9px; border-radius: 6px;
          }
          .dw-stock-change.up   { background: rgba(52,211,153,.15); color: #34D399; }
          .dw-stock-change.down { background: rgba(251,113,133,.15); color: #FB7185; }

          /* Notícias */
          .dw-news-list { display: flex; flex-direction: column; overflow: hidden; }
          .dw-news-item {
            display: flex; align-items: flex-start; gap: 10px;
            font-size: 1.8vh; line-height: 1.4;
            padding: 1.2vh 0; border-bottom: 1px solid rgba(255,255,255,.06);
          }
          .dw-news-item:last-child { border-bottom: none; }

          /* Enquete (Fase 7) */
          .dw-live-dot-poll { background: #00D9FF; }
          .dw-poll-body { display: flex; gap: 2vh; flex: 1; align-items: center; min-height: 0; }
          .dw-poll-main { flex: 1; min-width: 0; }
          .dw-poll-question { font-size: 2.1vh; font-weight: 700; line-height: 1.35; margin-bottom: 1.6vh; }
          .dw-poll-bars { display: flex; flex-direction: column; gap: 1vh; }
          .dw-poll-row-label { display: flex; justify-content: space-between; font-size: 1.5vh; margin-bottom: 4px; }
          .dw-poll-pct {
            font-family: 'Space Grotesk', ui-monospace, monospace;
            font-variant-numeric: tabular-nums; font-weight: 700;
          }
          .dw-poll-track { height: 8px; background: rgba(255,255,255,.08); border-radius: 4px; overflow: hidden; }
          .dw-poll-fill {
            height: 100%; border-radius: 4px;
            background: linear-gradient(90deg, var(--accent-1, #00D9FF), var(--accent-2, #7B61FF));
            transition: width .6s ease, background 1.4s ease;
          }
          .dw-poll-total { font-size: 1.3vh; opacity: .45; margin-top: 1.4vh; }
          .dw-poll-qr { flex-shrink: 0; text-align: center; }
          .dw-poll-qr img { width: 9vh; height: 9vh; border-radius: 8px; background: #fff; padding: 4px; }
          .dw-poll-qr-label { font-size: 1.1vh; opacity: .55; margin-top: 6px; line-height: 1.3; }
          .dw-news-bar {
            width: 3px; flex-shrink: 0; align-self: stretch;
            background: linear-gradient(180deg, var(--accent-1, #00D9FF), var(--accent-2, #7B61FF));
            border-radius: 2px; margin-top: 2px;
            transition: background 1.4s ease;
          }
          .slide {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            z-index: 1;
          }
          .slide.active { opacity: 1; z-index: 2; }
          .slide img, .slide video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Fase 12 — efeitos de transição entre slides. Corte instantâneo
             continua sendo o padrão de segurança ("none") se algo não bater
             com nenhum dos 3 casos abaixo.
             Fase 29 (20/07/2026): seletores movidos de [data-transition] no
             CONTAINER pai (#player) pra [data-transition] em CADA .slide —
             permite que vídeos diferentes na mesma tela usem transições
             diferentes (antes era uma escolha só, pra tela inteira). */
          .slide[data-transition="fade"] {
            transition: opacity 0.7s ease;
          }

          .slide[data-transition="cortina"] {
            opacity: 1;
            clip-path: inset(0 100% 0 0);
            transition: clip-path 0.7s ease;
          }
          .slide[data-transition="cortina"].active { clip-path: inset(0 0% 0 0); }
          .slide[data-transition="cortina"].leaving { clip-path: inset(0 0 0 100%); }

          .slide[data-transition="deslizar"] {
            opacity: 1;
            transform: translateX(100%);
            transition: transform 0.7s ease;
          }
          .slide[data-transition="deslizar"].active { transform: translateX(0%); }
          .slide[data-transition="deslizar"].leaving { transform: translateX(-100%); }
          /* Ken Burns sutil só em imagens — dá sensação de vida mesmo em
             conteúdo estático. Vídeos já têm movimento próprio, não precisam. */
          @keyframes dw-kenburns { from { transform: scale(1); } to { transform: scale(1.06); } }
          .slide.active img { animation: dw-kenburns 18s ease-in-out infinite alternate; }
          /* Elimina o "flash" do ícone nativo de play que alguns WebViews
             Android/Chromium mostram por uma fração de segundo na primeira
             reprodução de cada elemento <video> recém-criado, mesmo com
             autoplay+muted+playsinline já configurados via JS. */
          video::-webkit-media-controls,
          video::-webkit-media-controls-start-playback-button,
          video::-webkit-media-controls-play-button,
          video::-webkit-media-controls-overlay-play-button {
            display: none !important;
            -webkit-appearance: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* Fallback quando não há mídia */
          .default-screen {
            width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #F1F5F9;
          }
          .logo-icon {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #3B82F6, #6366F1);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 24px;
          }
          .logo-text {
            font-size: 48px; font-weight: 900;
            letter-spacing: -0.03em;
            margin-bottom: 12px;
          }
          .logo-text span { color: #3B82F6; }
          .tagline { font-size: 18px; color: #64748B; }
          .screen-code {
            margin-top: 32px;
            font-size: 14px; color: #374151;
            background: #1E293B;
            padding: 8px 20px; border-radius: 20px;
          }
          /* Barra de progresso */
          #progress-bar {
            position: fixed;
            bottom: 0; left: 0;
            height: 3px;
            background: #3B82F6;
            width: 0%;
            transition: width linear;
            z-index: 100;
          }
          /* Heartbeat indicator */
          #heartbeat {
            position: fixed;
            top: 12px; right: 12px;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #10B981;
            opacity: 0;
            z-index: 100;
          }
          /* QR code fixo no rodapé — captura de leads via Clube de Telas/CRM.
             Só fica visível nos últimos segundos de cada slide (controlado
             via JS, classe .qr-visible), pra não competir visualmente com
             o conteúdo o tempo todo. */
          #qr-footer {
            position: fixed;
            bottom: 10px; right: 10px;
            background: rgba(255,255,255,0.95);
            border-radius: 8px;
            padding: 5px;
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 90;
            opacity: 0;
            transform: translateY(6px);
            transition: opacity .4s ease, transform .4s ease;
            pointer-events: none;
          }
          #qr-footer.qr-visible {
            opacity: 1;
            transform: translateY(0);
          }
          #qr-footer img {
            width: 36px; height: 36px;
            display: block;
          }
          #qr-footer .qr-label {
            font-size: 9px;
            font-weight: 700;
            color: #0B1120;
            line-height: 1.25;
            max-width: 48px;
          }
        `}</style>
      <div id="player" className={[
        data.template === "magazine" ? (data.widgetPosition === "bottom" ? "has-bottom-banner-widgets" : "has-lateral-widgets") : "",
        // Fase 45 (16/08/2026): hook só de marcação — nenhum CSS/JS reage
        // a essa classe ainda neste MVP. Ver app/player/dtv/ e
        // docs/dtv-ready-mvp-plano.md. Não afeta layout nem comportamento
        // existente; dtvReady é sempre false por padrão.
        data.dtvReady ? "dtv-ready" : "",
      ].filter(Boolean).join(" ")} dangerouslySetInnerHTML={{ __html: playerInnerHtml }} />

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var medias   = ${mediasJson};
            var code     = ${JSON.stringify(code)};
            var isPreview = ${JSON.stringify(isPreview)};
            var isMagazine = ${JSON.stringify(data.template === "magazine")};
            // Fase 43 (21/08/2026): onde o painel de widgets está — usado
            // pra saber qual zona (lateral ou faixa inferior) está ocupada
            // pelo painel e qual está livre pro zoom de anúncio dinâmico
            // (Fase 33) continuar funcionando nela.
            var widgetPosition = ${JSON.stringify(data.widgetPosition || "lateral_right")};
            var widgetsInBottom = isMagazine && widgetPosition === "bottom";
            var widgetsInLateral = isMagazine && widgetPosition !== "bottom";
            // Fase 43: telas do "painel completo" (bolsa/câmbio/indicadores/
            // notícias/economia/qualidade do ar/enquete/loteria), já
            // renderizadas em HTML no servidor — o JS só troca qual delas
            // fica visível, ver comboCompletoCycle mais abaixo.
            var comboCompletoScreens = ${comboScreensJson};
            // Fase 29/31 (20/07/2026): padrão de transição da tela — usado
            // como fallback pra item que não tem transição própria escolhida.
            var screenDefaultTransition = ${JSON.stringify(data.transitionEffect)};
            var isGenericLayout = ${JSON.stringify(!!data.layoutZones)};
            var brandColorHex = ${JSON.stringify(data.primary_color || "#3B82F6")};
            // Fase 20 (14/07/2026): opt-in de áudio por cliente. false
            // (mudo) é o padrão de sempre — só muda se o dono configurar.
            // "var" (não "const") porque o ciclo de refresh (pollPlaylist)
            // pode atualizar isso se o dono ligar/desligar em outra aba.
            var audioEnabled = ${JSON.stringify(!!data.audio_enabled)};

            // ── Motor de cor "Aurora" (Fase 5) ──────────────────────────────
            // A cor da marca (cadastrada pelo cliente) é a base. Sempre que o
            // conteúdo principal troca de slide, extraímos a cor dominante
            // do frame via canvas e misturamos com a marca — o tema nunca
            // fica 100% preso a um nem 100% preso ao outro. Se a extração
            // falhar (ex: CORS do bucket não configurado), cai de volta pra
            // usar só a cor da marca, sem quebrar nada.
            function hexToHsl(hex) {
              var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
              var max = Math.max(r,g,b), min = Math.min(r,g,b);
              var h, s, l = (max+min)/2;
              if (max === min) { h = s = 0; }
              else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                else if (max === g) h = (b - r) / d + 2;
                else h = (r - g) / d + 4;
                h *= 60;
              }
              return { h: h, s: s*100, l: l*100 };
            }
            function hslToHex(h, s, l) {
              s /= 100; l /= 100;
              function k(n) { return (n + h/30) % 12; }
              var a = s * Math.min(l, 1-l);
              function f(n) { return l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1))); }
              function toHex(x) { var v = Math.round(255*x).toString(16); return v.length === 1 ? '0'+v : v; }
              return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
            }
            function hexToRgbTuple(hex) {
              return parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16);
            }
            function blendHue(h1, h2, weight) {
              var diff = ((h2 - h1 + 540) % 360) - 180;
              return (h1 + diff * weight + 360) % 360;
            }

            var brandHsl = hexToHsl(brandColorHex);
            var brandHue = brandHsl.h, brandSat = Math.max(brandHsl.s, 55), brandLight = 58;
            var lastContentHue = null;

            function extractDominantHue(mediaEl) {
              try {
                var canvas = document.createElement('canvas');
                canvas.width = 24; canvas.height = 24;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(mediaEl, 0, 0, 24, 24);
                var data = ctx.getImageData(0, 0, 24, 24).data;
                var r = 0, g = 0, b = 0, n = 0;
                for (var i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; n++; }
                r /= n; g /= n; b /= n;
                var hex = '#' + Math.round(r).toString(16).padStart(2,'0') + Math.round(g).toString(16).padStart(2,'0') + Math.round(b).toString(16).padStart(2,'0');
                return hexToHsl(hex).h;
              } catch (e) {
                // CORS do bucket provavelmente não configurado — cai pra cor da marca, sem travar nada
                return null;
              }
            }

            function applyColorTheme(contentHue) {
              var CONTENT_WEIGHT = 0.55;
              var finalHue = (contentHue === null || contentHue === undefined)
                ? brandHue
                : blendHue(brandHue, contentHue, CONTENT_WEIGHT);
              var accent1 = hslToHex(finalHue, brandSat, brandLight);
              var accent2 = hslToHex((finalHue + 35) % 360, brandSat, brandLight);
              var root = document.documentElement.style;
              root.setProperty('--accent-1', accent1);
              root.setProperty('--accent-2', accent2);
              root.setProperty('--bg-tint', hexToRgbTuple(accent1));
            }
            applyColorTheme(null); // aplica a cor da marca já de cara, antes de qualquer extração

            // ── Tint por horário do dia (Fase 30, 20/07/2026) ──────────────
            // Puramente decorativo, aditivo — nunca reescreve --accent-1/2
            // (esses continuam do motor Aurora). 4 momentos, cada um com um
            // matiz e opacidade diferentes; noite mais sutil (tela já é mais
            // escura por padrão), manhã/entardecer com tom mais quente.
            function applyTimeOfDayTint() {
              var hour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }), 10);
              var color, opacity;
              if (hour >= 5 && hour < 12)       { color = '255,180,84';  opacity = '.12'; }  // manhã — quente
              else if (hour >= 12 && hour < 18) { color = '0,217,255';   opacity = '.08'; }   // tarde — frio, sutil
              else if (hour >= 18 && hour < 21) { color = '255,122,162'; opacity = '.14'; }    // entardecer — rosa/quente
              else                              { color = '123,97,255'; opacity = '.10'; }    // noite — roxo suave
              var root = document.documentElement.style;
              root.setProperty('--daytint-color', 'rgba(' + color + ', ' + opacity + ')');
              root.setProperty('--daytint-opacity', '1');
            }
            applyTimeOfDayTint();
            setInterval(applyTimeOfDayTint, 60000);

            // ── Widgets combinados (Fase 39, 20/07/2026) ──────────────────
            // Cada .dw-combo tem 2 lados (.dw-combo-side); alterna qual está
            // .active a cada COMBO_CYCLE_MS. Cada combo tem seu PRÓPRIO
            // timer independente (não sincronizados entre si de propósito —
            // evita os dois cards trocarem exatamente juntos, fica mais
            // "vivo"). Só roda se existir pelo menos um combo na página
            // (widgetLayoutMode !== 'revezando' não tem nenhum, não faz nada).
            var COMBO_CYCLE_MS = 10000;
            function initCombos() {
              var combos = document.querySelectorAll('[data-combo-id]');
              for (var i = 0; i < combos.length; i++) {
                (function(combo) {
                  var sides = combo.querySelectorAll('[data-combo-side]');
                  if (sides.length < 2) return;
                  var current = 0;
                  setInterval(function() {
                    sides[current].classList.remove('active');
                    current = (current + 1) % sides.length;
                    sides[current].classList.add('active');
                  }, COMBO_CYCLE_MS);
                })(combos[i]);
              }
            }
            initCombos();

            // ── Painel completo (Fase 43, 21/08/2026) ───────────────────────
            // Card único central revezando entre as telas de dado disponíveis
            // (comboCompletoScreens, já em HTML pronto, montado no servidor).
            // Mesmo padrão visual dos mockups aprovados: troca com fade (
            // opacity 0 → swap innerHTML → opacity 1), próximo elemento a
            // cada COMBO_COMPLETO_CYCLE_MS. Só roda se o elemento existir na
            // página (widgetLayoutMode !== 'painel_completo' não tem nenhum).
            var COMBO_COMPLETO_CYCLE_MS = 9000;
            var COMBO_COMPLETO_FADE_MS = 1200;
            function initComboCompleto() {
              var el = document.getElementById('combo-completo-inner');
              if (!el || !comboCompletoScreens.length) return;
              var idx = 0;
              function renderNext() {
                el.style.opacity = '0';
                setTimeout(function() {
                  el.innerHTML = comboCompletoScreens[idx % comboCompletoScreens.length];
                  idx++;
                  el.style.opacity = '1';
                }, COMBO_COMPLETO_FADE_MS);
              }
              renderNext();
              if (comboCompletoScreens.length > 1) {
                setInterval(renderNext, COMBO_COMPLETO_CYCLE_MS);
              }
            }
            initComboCompleto();

            // ── Relógio ao vivo (Fase 4b) ──────────────────────────────────
            // Roda independente do modo (magazine ou zonas genéricas) — só
            // atualiza os elementos que existirem na página, se existirem.
            function updateLiveClock() {
              var now = new Date();
              var timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
              var dateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: 'long' });
              var timeEls = document.querySelectorAll('[data-live-clock-time]');
              var dateEls = document.querySelectorAll('[data-live-clock-date]');
              for (var i = 0; i < timeEls.length; i++) timeEls[i].textContent = timeStr;
              for (var j = 0; j < dateEls.length; j++) dateEls[j].textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            }
            updateLiveClock();
            setInterval(updateLiveClock, 1000);

            // ── Enquete ao vivo (Fase 7) — atualiza a cada 15s, bem mais
            // rápido que o resto, pra sentir o resultado mudando enquanto
            // as pessoas votam pelo celular. Só roda se o widget existir
            // na página (não gasta requisição à toa se não tiver enquete).
            function updatePollResults() {
              var pollEl = document.querySelector('[data-poll-id]');
              if (!pollEl) return;
              var pollId = pollEl.getAttribute('data-poll-id');
              fetch('/api/polls/' + pollId)
                .then(function(r) { return r.json(); })
                .then(function(d) {
                  if (!d || !d.active) return;
                  var total = d.total || 0;
                  for (var i = 0; i < (d.counts || []).length; i++) {
                    var pct = total > 0 ? Math.round((d.counts[i] / total) * 100) : 0;
                    var fillEl = document.querySelector('[data-poll-fill="' + i + '"]');
                    var pctEl = document.querySelector('[data-poll-pct="' + i + '"]');
                    if (fillEl) fillEl.style.width = pct + '%';
                    if (pctEl) pctEl.textContent = pct + '%';
                  }
                  var totalEl = document.querySelector('[data-poll-total]');
                  if (totalEl) totalEl.textContent = total + (total === 1 ? ' voto' : ' votos');
                })
                .catch(function() {});
            }
            updatePollResults();
            setInterval(updatePollResults, 15000);

            var buildVersion = ${JSON.stringify(buildVersion)};
            var timer    = null;
            var qrTimer  = null;
            var qrEl     = document.getElementById('qr-footer');
            var progress = document.getElementById('progress-bar');
            var hb       = document.getElementById('heartbeat');
            var POLL_INTERVAL_MS = 2 * 60 * 1000; // verifica mudanças a cada 2 minutos

            // ── Divisão de slots por categoria ────────────────────────────────
            // 15% dono / 60% anunciante pago / 15% rede (Clube de Telas) / 10% institucional.
            // Quando uma categoria está vazia (ex: cliente ainda sem anunciante
            // pago), seu peso é redistribuído proporcionalmente entre as que têm
            // conteúdo — a tela nunca trava esperando uma categoria inexistente.
            // Pesos atualizados (12/07/2026 — Canal DOOHPLAY por segmento):
            // 'rede' zerada (0 registros em produção, Clube de Telas ainda não
            // usado por ninguém — reversível na hora se algum parceiro aparecer).
            // Os 15% que eram dela + 5% tirados do institucional genérico viraram
            // 'canal': conteúdo institucional segmentado por business_type do
            // cliente (placements_v2.segment_id → inventory_segments_v2).
            var CATEGORY_WEIGHTS = { dono: 15, anunciante: 60, rede: 0, institucional: 5, canal: 20 };
            // Fase 12 — precisa bater com a duração usada no CSS das
            // transições (0.7s); se mudar um, muda o outro junto.
            var TRANSITION_MS = 700;
            var groups  = {};  // { dono: [...], anunciante: [...], rede: [...], institucional: [...] }
            var cursors = { dono: 0, anunciante: 0, rede: 0, institucional: 0, canal: 0 };
            var upcoming = null; // próxima mídia já sorteada e pré-carregada
            var sequenceQueue = []; // Fase 9 — resto de uma sequência (canal
                                     // DOOHPLAY) em andamento, tocando em bloco

            // ── Compositor de zonas (Fase 3) ───────────────────────────────
            // mainMedias: tudo que é fullscreen (comportamento de sempre).
            // lateralMedias: itens marcados "encolhe lateral" — tocam numa
            // zona separada, à parte do ciclo principal, sem competir pelos
            // pesos de categoria (ficam sempre visíveis girando entre si
            // enquanto existir pelo menos um).
            var mainMedias = [];
            var lateralMedias = [];
            // Fase 33 (20/07/2026): mesma ideia da lateral, dois formatos novos.
            var bottomMedias = [];
            var floatingMedias = [];
            function splitByFormat(list) {
              var main = [], lateral = [], bottom = [], floating = [];
              for (var i = 0; i < list.length; i++) {
                if (list[i].displayFormat === 'shrink_lateral') lateral.push(list[i]);
                else if (list[i].displayFormat === 'banner_bottom') bottom.push(list[i]);
                else if (list[i].displayFormat === 'floating') floating.push(list[i]);
                else main.push(list[i]);
              }
              return { main: main, lateral: lateral, bottom: bottom, floating: floating };
            }

            function buildGroups(list) {
              var g = { dono: [], anunciante: [], rede: [], institucional: [], canal: [] };
              for (var i = 0; i < list.length; i++) {
                var cat = list[i].category;
                if (!g[cat]) g[cat] = [];
                g[cat].push(list[i]);
              }
              return g;
            }

            function pickNextMedia(allowSpecialTypes) {
              // Fase 9 — se uma sequência (canal DOOHPLAY) está em andamento,
              // continua ela antes de sortear de novo por peso de categoria.
              if (sequenceQueue.length > 0) {
                var queued = sequenceQueue.shift();
                if (!allowSpecialTypes && queued && (queued.type === 'layout' || queued.type === 'youtube')) {
                  return null; // sub-zona não sabe renderizar — pula essa vez
                }
                return queued;
              }

              // 'layout'/'youtube' só podem ser exibidos pela rotação de
              // tela cheia (showSlide) — uma sub-zona dentro de um layout
              // de página não sabe renderizar isso (só video/img), então
              // filtra ANTES de escolher, em vez de sortear e tentar nulo
              // depois (isso mexia no cursor compartilhado sem necessidade).
              var available = [];
              var totalWeight = 0;
              var usableByCategory = {};
              for (var cat in CATEGORY_WEIGHTS) {
                var rawList = groups[cat] || [];
                var usable = allowSpecialTypes
                  ? rawList
                  : rawList.filter(function(x) { return x.type !== 'layout' && x.type !== 'youtube'; });
                usableByCategory[cat] = usable;
                if (usable.length > 0) {
                  available.push(cat);
                  totalWeight += CATEGORY_WEIGHTS[cat];
                }
              }
              if (available.length === 0) return null;

              var r = Math.random() * totalWeight;
              var acc = 0;
              var chosen = available[available.length - 1];
              for (var j = 0; j < available.length; j++) {
                acc += CATEGORY_WEIGHTS[available[j]];
                if (r <= acc) { chosen = available[j]; break; }
              }

              var list = usableByCategory[chosen];
              var idx = cursors[chosen] % list.length;
              cursors[chosen] = idx + 1;
              var picked = list[idx];

              // Se o item sorteado faz parte de uma sequência, enfileira o
              // resto do grupo (na ordem em que aparece na lista) pra tocar
              // em bloco, um atrás do outro — sensação de "bloco de
              // programação da emissora" em vez de peça solta aleatória.
              if (picked && picked.sequenceGroup) {
                var groupItems = list.filter(function(x) { return x.sequenceGroup === picked.sequenceGroup; });
                if (groupItems.length > 1) {
                  var pickedPos = -1;
                  for (var k = 0; k < groupItems.length; k++) {
                    if (groupItems[k].id === picked.id) { pickedPos = k; break; }
                  }
                  sequenceQueue = groupItems.slice(pickedPos + 1);
                }
              }

              return picked;
            }

            var split = splitByFormat(medias);
            mainMedias = split.main;
            lateralMedias = split.lateral;
            bottomMedias = split.bottom;
            floatingMedias = split.floating;
            groups = buildGroups(mainMedias);

            // ── Zona lateral — slot único, ciclo próprio e independente ────
            var playerEl = document.getElementById('player');
            var lateralZoneEl = document.getElementById('lateral-zone');
            var lateralVideoEl = null;
            var lateralImgEl = null;
            var lateralTimer = null;
            var lateralIdx = 0;

            function initLateralZone() {
              if (!lateralZoneEl) return;
              lateralZoneEl.innerHTML = '';
              lateralVideoEl = document.createElement('video');
              // Fase 20 (14/07/2026): fica SEMPRE mudo, mesmo com audioEnabled
              // ligado — é um vídeo secundário tocando ao lado do conteúdo
              // principal (formato "encolhe lateral"); dois áudios ao mesmo
              // tempo seria pior que nenhum. Decisão consciente de escopo.
              lateralVideoEl.muted = true;
              lateralVideoEl.playsInline = true;
              lateralVideoEl.setAttribute('muted', '');
              lateralVideoEl.setAttribute('playsinline', '');
              lateralVideoEl.setAttribute('webkit-playsinline', '');
              lateralVideoEl.disableRemotePlayback = true;
              lateralImgEl = document.createElement('img');
              lateralZoneEl.appendChild(lateralVideoEl);
              lateralZoneEl.appendChild(lateralImgEl);
            }

            function showLateralSlide() {
              // Fase 43 (21/08/2026): só pula quando o painel de widgets
              // está de fato ocupando a zona LATERAL (widgetsInLateral) —
              // antes disso o zoom de anúncio dinâmico (shrink_lateral)
              // ficava sempre desligado com qualquer template magazine
              // ativo, mesmo quando o painel estava na faixa inferior e a
              // lateral estava livre. Classe própria (has-lateral-ad-zoom,
              // separada de has-lateral-widgets setada pelo server) — as
              // duas controlam a mesma largura via CSS combinado, sem
              // uma pisar na outra.
              if (widgetsInLateral || isGenericLayout) return;

              if (lateralTimer) { clearTimeout(lateralTimer); lateralTimer = null; }
              if (!lateralMedias.length) {
                if (playerEl) playerEl.classList.remove('has-lateral-ad-zoom');
                return;
              }
              if (playerEl) playerEl.classList.add('has-lateral-ad-zoom');
              if (!lateralVideoEl) initLateralZone();

              var m = lateralMedias[lateralIdx % lateralMedias.length];
              lateralIdx++;
              logPlay(m);

              var el = (m.type === 'video') ? lateralVideoEl : lateralImgEl;
              var other = (m.type === 'video') ? lateralImgEl : lateralVideoEl;
              other.style.display = 'none';
              if (other.tagName === 'VIDEO') { try { other.pause(); } catch (e) {} }

              if (el.tagName === 'IMG') el.alt = m.name || '';
              if (el.src !== m.url) el.src = m.url;
              el.style.display = 'block';

              // Fase 40 (20/07/2026): selo "Patrocinado" — só aparece quando
              // o item mostrado é de fato um anúncio pago (categoria
              // 'anunciante'); conteúdo próprio/institucional/canal na
              // mesma zona não leva selo.
              if (lateralZoneEl) {
                lateralZoneEl.classList.toggle('has-sponsor-badge', m.category === 'anunciante');
              }

              var dur = (Number(m.duration) || 15) * 1000;
              if (el.tagName === 'VIDEO') {
                el.currentTime = 0;
                el.onerror = function() {};
                var p = el.play();
                if (p && typeof p.catch === 'function') p.catch(function() {});
              }

              lateralTimer = setTimeout(showLateralSlide, dur);
            }

            // ── Faixa inferior (Fase 33, 20/07/2026) ──────────────────────
            // Mesmo padrão exato da zona lateral — só muda o elemento e a
            // classe CSS (largura → altura). Ver showLateralSlide acima pro
            // comentário completo da lógica.
            var bottomZoneEl = document.getElementById('bottom-zone');
            var bottomVideoEl = null;
            var bottomImgEl = null;
            var bottomTimer = null;
            var bottomIdx = 0;

            function initBottomZone() {
              if (!bottomZoneEl) return;
              bottomZoneEl.innerHTML = '';
              bottomVideoEl = document.createElement('video');
              bottomVideoEl.muted = true; // idem lateral: nunca dois áudios ao mesmo tempo
              bottomVideoEl.playsInline = true;
              bottomVideoEl.setAttribute('muted', '');
              bottomVideoEl.setAttribute('playsinline', '');
              bottomVideoEl.setAttribute('webkit-playsinline', '');
              bottomVideoEl.disableRemotePlayback = true;
              bottomImgEl = document.createElement('img');
              bottomZoneEl.appendChild(bottomVideoEl);
              bottomZoneEl.appendChild(bottomImgEl);
            }

            function showBottomSlide() {
              // Fase 43: mesma lógica de showLateralSlide, espelhada pra
              // faixa inferior — só pula quando o painel de widgets está
              // de fato ocupando a zona DE BAIXO (widgetsInBottom).
              if (widgetsInBottom || isGenericLayout) return;

              if (bottomTimer) { clearTimeout(bottomTimer); bottomTimer = null; }
              if (!bottomMedias.length) {
                if (playerEl) playerEl.classList.remove('has-bottom-banner-ad-zoom');
                return;
              }
              if (playerEl) playerEl.classList.add('has-bottom-banner-ad-zoom');
              if (!bottomVideoEl) initBottomZone();

              var m = bottomMedias[bottomIdx % bottomMedias.length];
              bottomIdx++;
              logPlay(m);

              var el = (m.type === 'video') ? bottomVideoEl : bottomImgEl;
              var other = (m.type === 'video') ? bottomImgEl : bottomVideoEl;
              other.style.display = 'none';
              if (other.tagName === 'VIDEO') { try { other.pause(); } catch (e) {} }

              if (el.tagName === 'IMG') el.alt = m.name || '';
              if (el.src !== m.url) el.src = m.url;
              el.style.display = 'block';

              // Fase 40 (20/07/2026): mesmo selo da lateral, ver comentário
              // em showLateralSlide.
              if (bottomZoneEl) {
                bottomZoneEl.classList.toggle('has-sponsor-badge', m.category === 'anunciante');
              }

              var dur = (Number(m.duration) || 15) * 1000;
              if (el.tagName === 'VIDEO') {
                el.currentTime = 0;
                el.onerror = function() {};
                var p = el.play();
                if (p && typeof p.catch === 'function') p.catch(function() {});
              }

              bottomTimer = setTimeout(showBottomSlide, dur);
            }

            // ── Flutuante (Fase 33, 20/07/2026) ───────────────────────────
            // Diferente de lateral/faixa: NUNCA reduz o conteúdo principal.
            // Ciclo próprio de "aparece por X segundos, some por Y segundos,
            // repete" — a rotação principal (showSlide) continua tocando por
            // baixo o tempo todo, sem pausar nem saber que isso existe.
            var FLOATING_VISIBLE_MS = 12000; // quanto tempo fica visível
            var FLOATING_HIDDEN_MS  = 45000; // quanto tempo some entre aparições
            var floatingZoneEl = document.getElementById('floating-zone');
            var floatingVideoEl = null;
            var floatingImgEl = null;
            var floatingCycleTimer = null;
            var floatingIdx = 0;

            function initFloatingZone() {
              if (!floatingZoneEl) return;
              floatingVideoEl = document.createElement('video');
              floatingVideoEl.muted = true; // sempre mudo — overlay nunca disputa áudio com o conteúdo principal
              floatingVideoEl.playsInline = true;
              floatingVideoEl.setAttribute('muted', '');
              floatingVideoEl.setAttribute('playsinline', '');
              floatingVideoEl.setAttribute('webkit-playsinline', '');
              floatingVideoEl.disableRemotePlayback = true;
              floatingImgEl = document.createElement('img');
              floatingZoneEl.appendChild(floatingVideoEl);
              floatingZoneEl.appendChild(floatingImgEl);
            }

            function floatingCycle() {
              if (!floatingMedias.length || !floatingZoneEl) {
                floatingCycleTimer = setTimeout(floatingCycle, FLOATING_HIDDEN_MS);
                return;
              }
              if (!floatingVideoEl) initFloatingZone();

              var m = floatingMedias[floatingIdx % floatingMedias.length];
              floatingIdx++;
              logPlay(m);

              var el = (m.type === 'video') ? floatingVideoEl : floatingImgEl;
              var other = (m.type === 'video') ? floatingImgEl : floatingVideoEl;
              other.style.display = 'none';
              if (other.tagName === 'VIDEO') { try { other.pause(); } catch (e) {} }

              if (el.tagName === 'IMG') el.alt = m.name || '';
              if (el.src !== m.url) el.src = m.url;
              el.style.display = 'block';
              if (el.tagName === 'VIDEO') {
                el.currentTime = 0;
                el.onerror = function() {};
                var p = el.play();
                if (p && typeof p.catch === 'function') p.catch(function() {});
              }

              // Fase 40 (20/07/2026): mesmo selo da lateral/faixa.
              floatingZoneEl.classList.toggle('has-sponsor-badge', m.category === 'anunciante');
              floatingZoneEl.classList.add('visible');

              floatingCycleTimer = setTimeout(function() {
                floatingZoneEl.classList.remove('visible');
                if (el.tagName === 'VIDEO') { try { el.pause(); } catch (e) {} }
                floatingCycleTimer = setTimeout(floatingCycle, FLOATING_HIDDEN_MS);
              }, FLOATING_VISIBLE_MS);
            }

            // ── Arquitetura de renderização sob demanda ──────────────────────
            // Em vez de criar um elemento <img>/<video> para CADA mídia da
            // playlist de uma vez (o que crescia com o tamanho da rede de
            // anunciantes e sobrecarregava a memória de TVs com hardware
            // limitado), mantemos só DOIS slots fixos no DOM:
            //   slotA / slotB — alternam entre "atual" e "próximo pré-carregado"
            // Isso mantém o uso de memória constante, não importa se a
            // playlist tem 5 ou 500 itens.

            var slotA = null;
            var slotB = null;
            var activeSlot = null; // referência ao slot atualmente visível

            // Cada slot mantém UM <video> e UM <img> fixos, criados uma
            // única vez, escondidos via display:none quando não usados.
            // Antes, cada troca de mídia criava um <video> NOVO do zero —
            // e WebViews Android/Chromium mostram um ícone nativo de play
            // por uma fração de segundo na primeira reprodução de cada
            // elemento <video> recém-criado, mesmo com autoplay+muted já
            // configurados. Reaproveitar o mesmo elemento e só trocar o
            // .src elimina esse "flash", porque o navegador não trata
            // isso como uma "nova" reprodução de mídia.
            function createSlot() {
              var div = document.createElement('div');
              div.className = 'slide';

              var video = document.createElement('video');
              video.muted = true;
              video.playsInline = true;
              video.preload = 'auto';
              video.controls = false;
              video.disableRemotePlayback = true;
              video.setAttribute('muted', '');
              video.setAttribute('autoplay', '');
              video.setAttribute('playsinline', '');
              video.setAttribute('webkit-playsinline', '');
              video.setAttribute('disablePictureInPicture', '');
              video.setAttribute('disableRemotePlayback', '');
              video.setAttribute('controlsList', 'nodownload noplaybackrate nofullscreen');
              video.style.display = 'none';

              var img = document.createElement('img');
              img.style.display = 'none';

              // Slide-layout (N-zonas) e YouTube (Fase 9) usam esse terceiro
              // elemento em vez de video/img — HTML arbitrário injetado.
              var custom = document.createElement('div');
              custom.style.cssText = 'width:100%;height:100%;display:none;position:relative;';

              div.appendChild(video);
              div.appendChild(img);
              div.appendChild(custom);

              return { el: div, video: video, img: img, custom: custom, customZoneTimers: [] };
            }

            function releaseSlot(slot) {
              if (!slot) return;
              try { slot.video.pause(); } catch (e) {}
              slot.el.classList.remove('active');
              slot.el.classList.remove('leaving');
            }

            function getSlotElement(slot, m) {
              if (m.type === 'layout' || m.type === 'youtube') return slot.custom;
              return (m.type === 'video') ? slot.video : slot.img;
            }

            function clearCustomZoneTimers(slot) {
              (slot.customZoneTimers || []).forEach(function(t) { clearTimeout(t); clearInterval(t); });
              slot.customZoneTimers = [];
            }

            // Devolve o HTML a injetar pra um item tipo 'layout'/'youtube' —
            // usado tanto pelo slot de tela cheia quanto por uma zona aninhada
            // dentro de um layout de página (Fase 9b).
            function buildCustomContentHtml(m) {
              if (m.type === 'youtube') {
                var videoId = extractYouTubeId(m.url);
                // Fase 20 (14/07/2026): segue a mesma preferência de áudio
                // do resto do player — YouTube não tem fallback automático
                // de autoplay bloqueado como o <video> tem, então com som
                // ligado é possível que o navegador recuse o autoplay aqui
                // (limitação conhecida do embed do YouTube).
                var muteParam = audioEnabled ? '0' : '1';
                return videoId
                  ? '<iframe style="width:100%;height:100%;border:0;" src="https://www.youtube.com/embed/' + videoId +
                    '?autoplay=1&mute=' + muteParam + '&controls=1&modestbranding=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>'
                  : '';
              }
              return m.layoutHtml || '';
            }

            // Preenche as sub-zonas de conteúdo (main_rotation/ad_only) de um
            // slide-layout recém-injetado — UM item só, fixo, pela duração
            // inteira do slide (sem rotação própria lá dentro, evita
            // temporizador aninhado demais). Reutilizada no topo e em zona
            // aninhada (Fase 9b) — não recursa em outro slide-layout lá
            // dentro, pra não criar aninhamento sem limite.
            function populateLayoutSlideSubZones(containerEl, zoneContent) {
              var zoneEls = containerEl.querySelectorAll('.zone[data-content-type="main_rotation"], .zone[data-content-type="ad_only"]');
              for (var zi = 0; zi < zoneEls.length; zi++) {
                (function(zoneEl) {
                  var contentType = zoneEl.getAttribute('data-content-type');
                  var zoneId = zoneEl.getAttribute('data-zone-id');
                  var mediaHost = zoneEl.querySelector('.zone-media');
                  if (!mediaHost) return;

                  // Fase 9c — conteúdo escolhido pelo admin pra essa zona
                  // específica tem prioridade sobre o sorteio automático.
                  var chosen = (zoneContent && zoneId && zoneContent[zoneId]) ? zoneContent[zoneId] : null;
                  var inner = chosen || ((contentType === 'main_rotation') ? pickNextMedia() : (lateralMedias[0] || null));
                  if (!inner) return;

                  var tag = inner.type === 'video' ? 'video' : 'img';
                  var innerEl = document.createElement(tag);
                  innerEl.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                  // Fase 20 (14/07/2026): SEMPRE mudo, mesmo com audioEnabled
                  // ligado — é conteúdo de fundo dentro de uma zona de um
                  // layout multi-zona, tocando ao lado de outras zonas
                  // (possivelmente outro vídeo). Decisão consciente de escopo.
                  if (tag === 'video') { innerEl.muted = true; innerEl.autoplay = true; innerEl.playsInline = true; innerEl.loop = true; }
                  innerEl.src = inner.url;
                  mediaHost.appendChild(innerEl);
                })(zoneEls[zi]);
              }
            }

            function fillSlot(slot, m) {
              // Fase 31 (20/07/2026 — correção de regressão da Fase 29):
              // a Fase 29 moveu o CSS de transição pra [data-transition] em
              // CADA .slide, mas só setava esse atributo no HTML renderizado
              // no servidor (slidesHtml) — que este motor de dois slots
              // (slotA/slotB, pré-carregamento) NUNCA usa de verdade: o JS
              // limpa #slides e recria os slides do zero aqui. Resultado: a
              // troca de slide real ficava SEM nenhuma transição configurada
              // (o atributo nunca existia nesses elementos), diferente do
              // "pulinho" que motivou a investigação, mas achado no caminho.
              // Consertado aqui, no único lugar que de fato importa.
              slot.el.setAttribute('data-transition', m.transitionEffect || screenDefaultTransition);

              // Slide-layout (N-zonas) ou YouTube (Fase 9) — usa o elemento
              // "custom", não video/img.
              if (m.type === 'layout' || m.type === 'youtube') {
                slot.video.style.display = 'none';
                slot.img.style.display = 'none';
                try { slot.video.pause(); } catch (e) {}
                clearCustomZoneTimers(slot);

                slot.custom.innerHTML = buildCustomContentHtml(m);
                if (m.type === 'layout') populateLayoutSlideSubZones(slot.custom, m.zoneContent);
                slot.custom.style.display = 'block';
                slot.custom.setAttribute('data-id', m.id);
                slot.custom.setAttribute('data-duration', m.duration);
                return slot.custom;
              }

              slot.custom.style.display = 'none';
              slot.custom.innerHTML = '';
              clearCustomZoneTimers(slot);

              var el = (m.type === 'video') ? slot.video : slot.img;
              var other = (m.type === 'video') ? slot.img : slot.video;

              other.style.display = 'none';
              if (other.tagName === 'VIDEO') {
                try { other.pause(); } catch (e) {}
              }

              if (el.tagName === 'IMG') {
                el.alt = m.name || '';
              }
              // Só reatribui o src se for realmente diferente — trocar o
              // src de um <video>/<img> já existente não dispara nenhuma
              // UI nativa de mídia, ao contrário de criar um elemento novo.
              if (el.src !== m.url) {
                el.src = m.url;
              }
              el.setAttribute('data-id', m.id);
              el.setAttribute('data-duration', m.duration);
              el.style.display = 'block';
              return el;
            }

            function isYouTubeIdChar(ch) {
              var code = ch.charCodeAt(0);
              return (code >= 48 && code <= 57)  // 0-9
                  || (code >= 65 && code <= 90)   // A-Z
                  || (code >= 97 && code <= 122)  // a-z
                  || ch === '_' || ch === '-';
            }

            function extractYouTubeId(url) {
              if (!url) return null;
              var markers = ['watch?v=', 'youtu.be/', '/embed/', '/shorts/'];
              for (var i = 0; i < markers.length; i++) {
                var idx = url.indexOf(markers[i]);
                if (idx === -1) continue;
                var rest = url.slice(idx + markers[i].length);
                var id = '';
                for (var c = 0; c < rest.length; c++) {
                  var ch = rest.charAt(c);
                  if (!isYouTubeIdChar(ch)) break;
                  id += ch;
                  if (id.length === 11) break;
                }
                if (id.length === 11) return id;
              }
              return null;
            }

            function initSlots() {
              var container = document.getElementById('slides');
              if (!container) return;
              container.innerHTML = '';
              slotA = createSlot();
              slotB = createSlot();
              container.appendChild(slotA.el);
              container.appendChild(slotB.el);
            }

            // Tentativa de suprimir a UI nativa "Now Playing"/transport
            // controls que o Android pode exibir para qualquer <video>
            // tocando, via Media Session API — suspeito adicional para o
            // flash do ícone de play, independente do navegador/WebView.
            if ('mediaSession' in navigator) {
              try {
                navigator.mediaSession.metadata = null;
                navigator.mediaSession.playbackState = 'none';
                ['play','pause','seekbackward','seekforward','previoustrack','nexttrack','stop'].forEach(function(action) {
                  try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {}
                });
              } catch (e) {}
            }

            function preloadNext(m) {
              // Pré-carrega a próxima mídia (já sorteada por pickNextMedia) no
              // slot inativo, para a troca ser instantânea sem esperar download.
              if (!m) return;
              var inactiveSlot = activeSlot === slotA ? slotB : slotA;
              fillSlot(inactiveSlot, m);
            }

            function mediasChanged(oldList, newList) {
              if (oldList.length !== newList.length) return true;
              for (var i = 0; i < oldList.length; i++) {
                if (oldList[i].id !== newList[i].id) return true;
                if (oldList[i].url !== newList[i].url) return true;
                if (oldList[i].duration !== newList[i].duration) return true;
              }
              return false;
            }

            // Busca a playlist atual no servidor; se mudou, atualiza a lista
            // em memória sem interromper a mídia que está passando agora —
            // o próximo preloadNext já vai refletir a playlist nova.
            function pollPlaylist() {
              // Checa se subiu um deploy novo desde que esta página carregou.
              // Roda no mesmo ciclo de 2 min do polling de conteúdo — sem
              // precisar de WebSocket nem nenhuma infraestrutura nova.
              // Se mudou, recarrega na hora (com cache-buster); se não
              // mudou, nem toca na tela.
              fetch('/api/player/version')
                .then(function(res) { return res.json(); })
                .then(function(v) {
                  if (v && v.version && v.version !== buildVersion) {
                    var base = location.pathname + '?screen=' + encodeURIComponent(code);
                    location.href = base + '&_r=' + Date.now();
                  }
                })
                .catch(function(){});

              fetch('/api/client/playlist/' + encodeURIComponent(code))
                .then(function(res) { return res.json(); })
                .then(function(data) {
                  if (!data || !Array.isArray(data.items)) return;

                  // Fase 20 (14/07/2026): reflete mudança de preferência de
                  // áudio sem precisar recarregar a página inteira.
                  if (typeof data.audio_enabled === 'boolean') audioEnabled = data.audio_enabled;

                  var fresh = data.items
                    .filter(function(item) {
                      return item.asset_url && item.active !== false && item.status !== 'rejected';
                    })
                    .map(function(item) {
                      return {
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        url: item.asset_url,
                        duration: Number(item.duration) || 15,
                        category: item.slot_category || 'dono',
                        // Fase 33 (20/07/2026): reconhece os 2 formatos novos
                        // também no polling, não só na carga inicial.
                        displayFormat: (item.display_format === 'shrink_lateral' || item.display_format === 'banner_bottom' || item.display_format === 'floating')
                          ? item.display_format : 'fullscreen',
                        // Fase 19 (14/07/2026): sem isso, item 'layout'/'youtube'
                        // aparecia certo só na carga inicial (SSR) e sumia no
                        // primeiro refresh, porque esse mapper descartava os
                        // campos que esses dois tipos precisam pra renderizar.
                        layoutZones: item.layout_zones ?? null,
                        zoneContent: item.zone_content ?? null,
                        sequenceGroup: item.sequence_group ?? null,
                      };
                    });

                  if (fresh.length === 0) return; // evita apagar a tela se a API falhar parcialmente

                  // Tela começou sem nenhuma mídia (mostrando "Aguardando
                  // conteúdo") e agora chegou a primeira — precisa montar a
                  // estrutura de slides do zero e começar o ciclo, já que
                  // isso nunca tinha sido inicializado.
                  if (medias.length === 0 && fresh.length > 0) {
                    medias = fresh;
                    var splitFirst = splitByFormat(medias);
                    mainMedias = splitFirst.main;
                    lateralMedias = splitFirst.lateral;
                    bottomMedias = splitFirst.bottom;
                    floatingMedias = splitFirst.floating;
                    groups = buildGroups(mainMedias);
                    cursors = { dono: 0, anunciante: 0, rede: 0, institucional: 0, canal: 0 };
                    var contentArea = document.getElementById('content-area');
                    if (contentArea) {
                      contentArea.innerHTML = '<div id="slides"></div>';
                      slotA = null; slotB = null; activeSlot = null;
                      initSlots();
                      showSlide(pickNextMedia(true));
                    }
                    showLateralSlide();
                    showBottomSlide();
                    return;
                  }

                  if (mediasChanged(medias, fresh)) {
                    medias = fresh;
                    var splitNew = splitByFormat(medias);
                    mainMedias = splitNew.main;
                    lateralMedias = splitNew.lateral;
                    bottomMedias = splitNew.bottom;
                    floatingMedias = splitNew.floating;
                    groups = buildGroups(mainMedias);
                    cursors = { dono: 0, anunciante: 0, rede: 0, institucional: 0, canal: 0 };
                    // não força troca imediata — deixa o ciclo atual terminar
                    // normalmente; o próximo pickNextMedia já usa os grupos novos.
                    // A zona lateral/faixa também não é interrompida — o timer
                    // em curso vai ler os arrays atualizados na próxima virada.
                    // Flutuante não precisa de tratamento especial aqui: seu
                    // próprio ciclo (floatingCycle) já relê floatingMedias
                    // sozinho a cada rodada.
                    if (!lateralTimer) showLateralSlide();
                    if (!bottomTimer) showBottomSlide();
                  }
                })
                .catch(function() {
                  // Falha de rede no polling não deve travar o player —
                  // mantém a playlist atual em memória e tenta de novo no próximo ciclo
                });
            }

            // Sem mídia — apenas heartbeat
            if (!mainMedias.length && !lateralMedias.length) {
              sendHeartbeat();
              setInterval(sendHeartbeat, 30000);
              setInterval(pollPlaylist, POLL_INTERVAL_MS);
              return;
            }

            // ── Layout genérico de N zonas (Fase 4) ───────────────────────────
            // Cada zona roda sua própria rotação, independente das outras.
            // Zonas 'main_rotation' reaproveitam o mesmo sorteio ponderado por
            // categoria (groups/pickNextMedia) que o modo fullscreen usa.
            // Zonas 'ad_only' giram só entre os itens "encolhe lateral"
            // (lateralMedias) em sequência simples. Zonas de widget (clima/
            // bolsa/notícias) já vêm prontas do servidor, sem rotação.
            function initGenericZones() {
              var zoneEls = document.querySelectorAll('#zones-root .zone');
              for (var i = 0; i < zoneEls.length; i++) {
                (function(zoneEl) {
                  var contentType = zoneEl.getAttribute('data-content-type');
                  if (contentType !== 'main_rotation' && contentType !== 'ad_only') return;

                  var mediaHost = zoneEl.querySelector('.zone-media');
                  if (!mediaHost) return;

                  var videoEl = document.createElement('video');
                  videoEl.muted = true; videoEl.playsInline = true; videoEl.autoplay = true;
                  videoEl.setAttribute('muted', ''); videoEl.setAttribute('playsinline', '');
                  videoEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:none;';
                  var imgEl = document.createElement('img');
                  imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:none;';
                  // Fase 9b — layout/youtube dentro de uma zona aninhada
                  // (dentro de um layout de página) usa esse terceiro
                  // elemento, igual ao slot de tela cheia.
                  var customEl = document.createElement('div');
                  customEl.style.cssText = 'width:100%;height:100%;display:none;position:relative;';
                  mediaHost.appendChild(videoEl);
                  mediaHost.appendChild(imgEl);
                  mediaHost.appendChild(customEl);

                  var adIdx = 0;
                  function getNext() {
                    // Fase 9b — zona aninhada agora também pode mostrar
                    // layout/youtube (não só a rotação de tela cheia).
                    if (contentType === 'main_rotation') return pickNextMedia(true);
                    if (!lateralMedias.length) return null;
                    var m = lateralMedias[adIdx % lateralMedias.length];
                    adIdx++;
                    return m;
                  }

                  var zoneTimer = null;
                  function showNext() {
                    if (zoneTimer) { clearTimeout(zoneTimer); zoneTimer = null; }
                    var m = getNext();
                    if (!m) { zoneTimer = setTimeout(showNext, 5000); return; }
                    logPlay(m);

                    if (m.type === 'layout' || m.type === 'youtube') {
                      videoEl.style.display = 'none';
                      imgEl.style.display = 'none';
                      try { videoEl.pause(); } catch (e) {}
                      customEl.innerHTML = buildCustomContentHtml(m);
                      if (m.type === 'layout') populateLayoutSlideSubZones(customEl, m.zoneContent);
                      customEl.style.display = 'block';
                      var dur2 = (Number(m.duration) || 15) * 1000;
                      zoneTimer = setTimeout(showNext, dur2);
                      return;
                    }
                    customEl.style.display = 'none';
                    customEl.innerHTML = '';

                    var el = (m.type === 'video') ? videoEl : imgEl;
                    var other = (m.type === 'video') ? imgEl : videoEl;
                    other.style.display = 'none';
                    if (other.tagName === 'VIDEO') { try { other.pause(); } catch (e) {} }

                    if (el.tagName === 'IMG') el.alt = m.name || '';
                    if (el.src !== m.url) el.src = m.url;
                    el.style.display = 'block';

                    var dur = (Number(m.duration) || 15) * 1000;
                    if (el.tagName === 'VIDEO') {
                      el.currentTime = 0;
                      el.onerror = function() {};
                      var p = el.play();
                      if (p && typeof p.catch === 'function') p.catch(function() {});
                    }
                    zoneTimer = setTimeout(showNext, dur);
                  }

                  showNext();
                })(zoneEls[i]);
              }
            }

            if (isGenericLayout) {
              initGenericZones();
            } else {
              initSlots();
              showLateralSlide();
              showBottomSlide();
              floatingCycle();
            }

            function showSlide(m) {
              if (!m) return;
              logPlay(m);

              var targetSlot;

              if (!activeSlot) {
                // Primeira chamada: ainda não há nada na tela, usa slotA direto.
                targetSlot = slotA;
                fillSlot(targetSlot, m);
              } else {
                // Nas chamadas seguintes, o slot inativo já foi pré-carregado
                // pela chamada anterior de preloadNext().
                targetSlot = (activeSlot === slotA) ? slotB : slotA;
                var loadedEl = getSlotElement(targetSlot, m);
                if (loadedEl.getAttribute('data-id') !== m.id) {
                  // Pré-carregado não corresponde ao esperado (playlist mudou
                  // no meio do caminho) — refaz o conteúdo deste slot agora.
                  fillSlot(targetSlot, m);
                }
                // Fase 12 — o slot que estava em exibição entra em "saindo"
                // (dispara a transição de saída via CSS) em vez de ser
                // liberado na hora — isso daria um corte seco no meio do
                // efeito. releaseSlot() de verdade (pausar vídeo etc.) só
                // acontece depois que a transição termina.
                var leavingSlot = activeSlot;
                leavingSlot.el.classList.add('leaving');
                leavingSlot.el.classList.remove('active');
                setTimeout(function() { releaseSlot(leavingSlot); }, TRANSITION_MS);
              }

              activeSlot = targetSlot;
              activeSlot.el.classList.add('active');

              var dur = (Number(m.duration) || 15) * 1000;
              var mediaId = m.id;
              var el = getSlotElement(activeSlot, m);

              // Motor de cor (Fase 5): extrai a cor dominante deste slide
              // assim que o frame estiver pronto, e mistura com a cor da
              // marca. Se falhar (CORS), applyColorTheme(null) já foi
              // chamado no início e o tema da marca continua valendo.
              if (m.type === 'video') {
                el.addEventListener('loadeddata', function onLoadedData() {
                  lastContentHue = extractDominantHue(el);
                  applyColorTheme(lastContentHue);
                }, { once: true });
              } else if (el) {
                if (el.complete) {
                  lastContentHue = extractDominantHue(el);
                  applyColorTheme(lastContentHue);
                } else {
                  el.addEventListener('load', function onLoad() {
                    lastContentHue = extractDominantHue(el);
                    applyColorTheme(lastContentHue);
                  }, { once: true });
                }
              }

              // Garante que esta mídia só avança UMA vez, seja por onended,
              // erro de carregamento, falha de autoplay ou pelo timeout de
              // segurança — nunca mais de uma chamada de nextSlide() por slide.
              var advanced = false;
              function advanceOnce() {
                if (advanced) return;
                advanced = true;
                nextSlide();
              }

              if (timer) clearTimeout(timer);

              if (el && el.tagName === 'VIDEO') {
                el.currentTime = 0;
                // Fase 20 (14/07/2026): som é opt-in por cliente. Continua
                // mudo por padrão (decisão de produto — ambiente de
                // barbearia/farmácia/restaurante já tem som próprio) e só
                // toca com áudio se o dono tiver ligado explicitamente.
                el.muted = !audioEnabled;
                // Vídeo corrompido, codec incompatível ou erro de rede —
                // pula para o próximo em vez de travar a tela exibindo o
                // ícone de play nativo do WebView (causa real do "player
                // entra e volta pra tela inicial" — a TV mata o app depois
                // de um tempo preso sem nada acontecendo).
                el.onerror = function() { advanceOnce(); };
                var playPromise = el.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                  playPromise.catch(function() {
                    // Autoplay COM som é bloqueado por padrão pelo navegador/
                    // WebView (exige mudo ou um gesto do usuário que não
                    // existe numa TV) — cai pro mudo e tenta de novo, em vez
                    // de pular o slide inteiro só porque o som não tocou.
                    if (!el.muted) {
                      el.muted = true;
                      var retryPromise = el.play();
                      if (retryPromise && typeof retryPromise.catch === 'function') {
                        retryPromise.catch(function() { advanceOnce(); });
                      }
                    } else {
                      advanceOnce();
                    }
                  });
                }
                el.onended = function() { advanceOnce(); };
                dur = Math.max(dur, (el.duration || 0) * 1000);
                // Rede de segurança final: mesmo que nenhum evento dispare
                // (vídeo trava no meio, "stalled" silencioso etc.), nunca
                // fica preso por mais de ~45s nesse slide.
                timer = setTimeout(advanceOnce, Math.max(dur, 45000));
              } else {
                if (el) el.onerror = function() { advanceOnce(); };
                timer = setTimeout(advanceOnce, dur);
              }

              // QR "Receba novidades": só aparece nos últimos 5s do slide,
              // em vez de ficar fixo o tempo todo competindo visualmente
              // com o conteúdo. Em slides mais curtos que 5s, aparece desde
              // o início.
              if (qrTimer) clearTimeout(qrTimer);
              if (qrEl) {
                qrEl.classList.remove('qr-visible');
                var qrShowAt = Math.max(dur - 5000, 0);
                qrTimer = setTimeout(function() {
                  if (qrEl) qrEl.classList.add('qr-visible');
                }, qrShowAt);
              }

              // Barra de progresso
              if (progress) {
                progress.style.transition = 'none';
                progress.style.width = '0%';
                setTimeout(function() {
                  progress.style.transition = 'width ' + dur + 'ms linear';
                  progress.style.width = '100%';
                }, 50);
              }

              // Registra exibição
              logDisplay(mediaId, code);

              // Sorteia (respeitando os pesos de categoria) e pré-carrega a
              // próxima mídia no slot que ficou de fundo.
              upcoming = pickNextMedia(true);
              preloadNext(upcoming);
            }

            function nextSlide() {
              if (!upcoming) upcoming = pickNextMedia(true);
              var m = upcoming;
              upcoming = null;
              showSlide(m);
            }

            function logDisplay(mediaId, screenCode) {
              if (isPreview) return; // preview no dashboard não conta como exibição real
              fetch('/api/player/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_id: mediaId, screen_code: screenCode, played_at: new Date().toISOString() })
              }).catch(function(){});
            }

            function sendHeartbeat() {
              if (isPreview) return; // idem — não marca heartbeat real pela visualização do dashboard
              fetch('/api/player/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ screen_code: code })
              }).then(function() {
                if (hb) {
                  hb.style.opacity = '1';
                  setTimeout(function() { hb.style.opacity = '0'; }, 500);
                }
              }).catch(function(){});
            }

            // ── Proof-of-play real (Fase 8) ─────────────────────────────────
            // Registra CADA exibição de verdade — nunca em preview do
            // dashboard (isPreview), pra não poluir o relatório real com
            // visualização interna. Fire-and-forget: nunca trava o player
            // se a rota falhar.
            function logPlay(m) {
              if (isPreview || !m) return;
              fetch('/api/player/play-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_code: code,
                  media_id: m.id,
                  media_name: m.name,
                  media_type: m.type,
                  slot_category: m.category || null,
                  duration_seconds: Number(m.duration) || null,
                })
              }).catch(function(){});
            }

            // ── Recarga periódica automática ──────────────────────────────────
            // Garante, sem precisar de nenhuma ação manual em cada TV, que o
            // app sempre busca o HTML/JS mais recente (em vez de confiar em
            // cache do WebView/CDN nunca expirar) e também zera qualquer
            // acúmulo de memória do processo de tempos em tempos — proteção
            // adicional contra o tipo de travamento já visto em hardware
            // mais limitado (Fire Stick / Android TV mais antigas).
            // ── Recarga periódica de segurança ────────────────────────────────
            // A checagem de versão (dentro de pollPlaylist, a cada 2 min) já
            // cobre a atualização de código de verdade. Esta aqui é só uma
            // rede de segurança extra — zera memória do processo e garante
            // uma recarga mesmo se, por algum motivo, a checagem de versão
            // falhar silenciosamente por um tempo.
            var RELOAD_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
            setTimeout(function() {
              var base = location.pathname + '?screen=' + encodeURIComponent(code);
              location.href = base + '&_r=' + Date.now(); // cache-buster força recarga real
            }, RELOAD_INTERVAL_MS);

            // Inicia
            if (!isGenericLayout) showSlide(pickNextMedia(true));
            setInterval(sendHeartbeat, 30000);
            setInterval(pollPlaylist, POLL_INTERVAL_MS);
          })();
        `}} />
    </>
  )
}
