// lib/crm-session.ts
// Sessão do CRM interno (Fase 46, 17/08/2026) — mesmo mecanismo de
// lib/client-session.ts (cookie assinado com HMAC-SHA256 nativo do Node),
// deliberadamente separado dos outros sistemas de sessão: o CRM não tem
// código de cliente nem papel/role, é só "PIN correto ou não". Criado
// junto da correção do achado da varredura ampla — antes disso o PIN
// "dooh2026" era comparado no navegador e ficava visível no código-fonte
// da página; agora a comparação acontece no servidor e o valor do PIN
// nunca chega no bundle do client.
import { createHmac, timingSafeEqual } from "crypto"

export const CRM_SESSION_COOKIE = "doohplay_crm_session"
const SESSION_HOURS = 12

function secret(): string {
  const s = process.env.CRM_SESSION_SECRET || process.env.CLIENT_SESSION_SECRET
  if (!s) {
    // Falha fechada de propósito, mesmo espírito de client-session.ts:
    // sem secret configurado, ninguém consegue criar nem validar sessão.
    throw new Error("CRM_SESSION_SECRET (ou CLIENT_SESSION_SECRET) não configurado")
  }
  return s
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function createCrmSessionToken(): string {
  const exp = Date.now() + SESSION_HOURS * 3600_000
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url")
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifyCrmSessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return false

  try {
    const expectedSig = sign(payload)
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
    if (typeof data.exp !== "number") return false
    if (Date.now() > data.exp) return false

    return true
  } catch {
    return false
  }
}

export const CRM_SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 3600

// PIN de acesso ao CRM. Configurável via env var CRM_PIN — se não estiver
// definida, cai no valor que já era hardcoded no client antes desta
// correção (mantém o time funcionando sem exigir configurar o Render
// imediatamente), mas o recomendado é definir CRM_PIN no ambiente de
// produção pra trocar o valor sem precisar de deploy de código.
export function getCrmPin(): string {
  return process.env.CRM_PIN || "dooh2026"
}
