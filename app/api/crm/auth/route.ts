// app/api/crm/auth/route.ts
// Verifica o PIN do CRM no servidor e devolve um cookie httpOnly de sessão
// (Fase 46, 17/08/2026). Antes, o PIN era comparado no navegador — dava
// pra ver o valor no código-fonte da página. Timing-safe não é necessário
// aqui (PIN curto, não é segredo criptográfico, só uma trava básica de
// acesso pra uma ferramenta interna), mas o valor em si não trafega mais
// pro client.
import { NextRequest, NextResponse } from "next/server"
import { createCrmSessionToken, getCrmPin, CRM_SESSION_COOKIE, CRM_SESSION_MAX_AGE_SECONDS } from "@/lib/crm-session"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()
    if (String(pin || "") !== getCrmPin()) {
      return NextResponse.json({ error: "PIN incorreto" }, { status: 401 })
    }

    const token = createCrmSessionToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(CRM_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CRM_SESSION_MAX_AGE_SECONDS,
    })
    return res
  } catch (err) {
    console.error("[crm/auth]", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
