export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

import { createClient } from "@supabase/supabase-js"

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizePlaylistItem(item: any) {
  const assetUrl = item.asset_url ?? item.url ?? null

  return {
    ...item,
    url: assetUrl,
    asset_url: assetUrl,
    active: item.active !== false,
    status: item.status ?? "approved",
  }
}

function getSupabaseClient() {
  const url = safeString(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey)
}

async function resolveScreen(supabase: any, code: string) {
  const byId = await supabase
    .from("screens")
    .select("playlist_id")
    .eq("id", code)
    .maybeSingle()

  if (byId.error) {
    throw new Error(byId.error.message)
  }

  if (byId.data?.playlist_id) {
    return byId.data
  }

  const codeCandidates = ["code", "screen_code", "player_code"]

  for (const column of codeCandidates) {
    const byCode = await supabase
      .from("screens")
      .select("playlist_id")
      .eq(column, code)
      .maybeSingle()

    if (!byCode.error && byCode.data?.playlist_id) {
      return byCode.data
    }
  }

  return byId.data
}

async function fetchPlaylistItems(supabase: any, playlistId: string) {
  const { data: items, error } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (items ?? []).map(normalizePlaylistItem)
}

function normalizeCampaignItem(campaign: any, position: number) {
  const assetUrl = campaign.media_url ?? null

  return {
    id: campaign.id,
    name: campaign.name,
    type: "video",
    asset_url: assetUrl,
    url: assetUrl,
    active: campaign.is_active !== false,
    status: campaign.status ?? "approved",
    duration: campaign.duration_seconds ?? 15,
    campaign_id: campaign.id,
    position,
    slot_category: "anunciante",
  }
}

function isPlayableCampaign(campaign: any) {
  const mediaUrl = String(campaign.media_url ?? "")
  const status = String(campaign.status ?? "active").toLowerCase()

  return campaign.is_active !== false &&
    status !== "rejected" &&
    status !== "inactive" &&
    campaign.media_type === "video" &&
    mediaUrl.startsWith("http") &&
    !mediaUrl.includes("your-project-id")
}

async function fetchCampaignFallbackItems(supabase: any, code: string) {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .or(`player_code.is.null,player_code.eq.${code}`)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (campaigns ?? [])
    .filter(isPlayableCampaign)
    .map(normalizeCampaignItem)
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params
    const screenCode = safeString(code)

    if (!screenCode) {
      return Response.json({ error: "code required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      return Response.json({ error: "supabase env missing" }, { status: 500 })
    }

    const screen = await resolveScreen(supabase, screenCode)

    if (!screen?.playlist_id) {
      const campaignItems = await fetchCampaignFallbackItems(supabase, screenCode)

      return Response.json({
        items: campaignItems,
        slides: campaignItems,
        playlist: campaignItems,
      })
    }

    const playlistItems = await fetchPlaylistItems(supabase, screen.playlist_id)
    const items = playlistItems.length > 0
      ? playlistItems
      : await fetchCampaignFallbackItems(supabase, screenCode)

    return Response.json({ items, slides: items, playlist: items })
  } catch (error: any) {
    console.error("CLIENT PLAYLIST ERROR:", error)

    return Response.json(
      { error: error?.message ?? "playlist failed" },
      { status: 500 }
    )
  }
}
