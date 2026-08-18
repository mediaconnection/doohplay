// app/api/crm/leads/[id]/route.ts
// CRUD do CRM interno (Fase 46, 17/08/2026) — PATCH edita/move de etapa,
// DELETE remove. Ver app/api/crm/leads/route.ts (GET/POST) pro contexto
// completo da migração de localStorage pro banco.
import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { verifyCrmSessionToken, CRM_SESSION_COOKIE } from "@/lib/crm-session"

export const dynamic = "force-dynamic"

function checkAuth(req: NextRequest): boolean {
  return verifyCrmSessionToken(req.cookies.get(CRM_SESSION_COOKIE)?.value)
}

const EDITABLE_FIELDS = ["name", "business_type", "city", "phone", "contact_name", "stage", "notes", "last_contact"] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await params
  const pool = getPool()
  try {
    const body = await req.json()

    const sets: string[] = []
    const values: any[] = []
    let i = 1
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        sets.push(field === "last_contact" ? `${field} = $${i}::date` : `${field} = $${i}`)
        values.push(body[field])
        i++
      }
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: "Nenhum campo pra atualizar" }, { status: 400 })
    }
    sets.push(`updated_at = NOW()`)
    values.push(id)

    const { rows } = await pool.query(
      `UPDATE crm_leads SET ${sets.join(", ")}
       WHERE id = $${i}::uuid
       RETURNING id::text, name, business_type, city, phone, contact_name, stage, notes,
                 last_contact::text, created_at::text`,
      values
    )
    if (rows.length === 0) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    return NextResponse.json({ ok: true, lead: rows[0] })
  } catch (err) {
    console.error("[crm/leads/[id] PATCH]", err)
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { id } = await params
  const pool = getPool()
  try {
    await pool.query(`DELETE FROM crm_leads WHERE id = $1::uuid`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[crm/leads/[id] DELETE]", err)
    return NextResponse.json({ error: "Erro ao remover lead" }, { status: 500 })
  }
}
