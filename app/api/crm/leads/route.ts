// app/api/crm/leads/route.ts
// CRUD do CRM interno (Fase 46, 17/08/2026) — GET lista, POST cria.
// Substitui o localStorage que app/crm/page.tsx usava antes (achado da
// varredura ampla: leads não eram compartilhados entre a equipe nem
// tinham backup). Protegido pelo cookie de sessão do CRM (ver
// app/api/crm/auth/route.ts) — não usa NextAuth de propósito, mesmo
// motivo documentado em lib/crm-session.ts.
import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { verifyCrmSessionToken, CRM_SESSION_COOKIE } from "@/lib/crm-session"

export const dynamic = "force-dynamic"

function checkAuth(req: NextRequest): boolean {
  return verifyCrmSessionToken(req.cookies.get(CRM_SESSION_COOKIE)?.value)
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const pool = getPool()
  try {
    const { rows } = await pool.query(
      `SELECT id::text, name, business_type, city, phone, contact_name, stage, notes,
              last_contact::text, created_at::text
       FROM crm_leads
       ORDER BY created_at DESC`
    )
    return NextResponse.json({ leads: rows })
  } catch (err) {
    console.error("[crm/leads GET]", err)
    return NextResponse.json({ error: "Erro ao carregar leads" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const pool = getPool()
  try {
    const body = await req.json()
    const {
      name, business_type, city, phone, contact_name, stage, notes, last_contact,
    } = body

    if (!String(name || "").trim()) {
      return NextResponse.json({ error: "Nome do estabelecimento é obrigatório" }, { status: 400 })
    }

    const { rows } = await pool.query(
      `INSERT INTO crm_leads (name, business_type, city, phone, contact_name, stage, notes, last_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE))
       RETURNING id::text, name, business_type, city, phone, contact_name, stage, notes,
                 last_contact::text, created_at::text`,
      [
        name, business_type || "Outro", city || "São Paulo", phone || "",
        contact_name || "", stage || "contato", notes || "", last_contact || null,
      ]
    )
    return NextResponse.json({ ok: true, lead: rows[0] })
  } catch (err) {
    console.error("[crm/leads POST]", err)
    return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 })
  }
}
