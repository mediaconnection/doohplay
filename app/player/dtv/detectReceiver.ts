// app/player/dtv/detectReceiver.ts
// Fase 45 (16/08/2026) — adapter de detecção de receptor DTV+ externo.
import type { DtvDetectionInput, DtvDetectionResult, DtvNativeBridge } from "./types"

/**
 * Decide se a tela deve se comportar como "TV 3.0 Ready" agora.
 *
 * IMPORTANTE (ver docs/dtv-ready-mvp-plano.md, seção 3): não existe API de
 * browser padrão pra consultar dispositivos HDMI-CEC a jusante — esta
 * função NUNCA finge detectar hardware que não conseguimos detectar.
 *
 * Ordem de prioridade do sinal:
 * 1. Ponte nativa Android (`window.DoohplayNativeBridge`), se existir e
 *    responder um valor booleano real — sinal automático de verdade,
 *    quando/se o app nativo (firestick-app/) passar a expor isso.
 * 2. Flag declarada (`dtv_ready`, configurada pelo instalador no admin,
 *    ver Fase 45 / feature_flags) — modo padrão hoje.
 * 3. Nenhum sinal disponível — `connected: false`, fallback gracioso: o
 *    player continua exatamente como um player comum, sem selo, sem
 *    priorizar VVC. Nenhuma tela existente muda de comportamento sem
 *    configuração explícita.
 */
export function detectDtvReceiver(input: DtvDetectionInput): DtvDetectionResult {
  const nativeSignal = input.nativeBridge?.getDtvReceiverConnected?.()

  if (typeof nativeSignal === "boolean") {
    return { connected: nativeSignal, source: "native-bridge", preferVvc: nativeSignal }
  }

  if (input.dtvReadyFlag === true) {
    return { connected: true, source: "declared-flag", preferVvc: true }
  }

  return { connected: false, source: "none", preferVvc: false }
}

/**
 * Resolve a ponte nativa opcional a partir de `window`, isolada numa
 * função própria só pra manter `detectDtvReceiver` testável sem precisar
 * de um DOM/window simulado. Hoje sempre retorna `undefined` em qualquer
 * ambiente real — não existe app nativo expondo essa ponte ainda.
 */
export function getNativeBridge(): DtvNativeBridge | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { DoohplayNativeBridge?: DtvNativeBridge }).DoohplayNativeBridge
}
