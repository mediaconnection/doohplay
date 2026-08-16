// app/player/dtv/detectReceiver.test.ts
// Fase 45 (16/08/2026) — testes básicos do adapter de detecção DTV+.
// Usa o test runner nativo do Node (node:test), sem dependência nova —
// este repositório não tem framework de testes configurado ainda
// (ver CLAUDE.md, "There are no automated tests in this codebase").
// Rodar com: npx tsx --test app/player/dtv/detectReceiver.test.ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { detectDtvReceiver } from "./detectReceiver"

test("sem sinal nativo e flag desligada: fallback gracioso, nada muda", () => {
  const result = detectDtvReceiver({ dtvReadyFlag: false })
  assert.equal(result.connected, false)
  assert.equal(result.source, "none")
  assert.equal(result.preferVvc, false)
})

test("sem sinal nativo, flag declarada ligada: modo declarativo", () => {
  const result = detectDtvReceiver({ dtvReadyFlag: true })
  assert.equal(result.connected, true)
  assert.equal(result.source, "declared-flag")
  assert.equal(result.preferVvc, true)
})

test("sinal nativo negativo tem prioridade sobre a flag declarada ligada", () => {
  const result = detectDtvReceiver({
    dtvReadyFlag: true,
    nativeBridge: { getDtvReceiverConnected: () => false },
  })
  assert.equal(result.connected, false)
  assert.equal(result.source, "native-bridge")
  assert.equal(result.preferVvc, false)
})

test("sinal nativo positivo tem prioridade mesmo com flag desligada", () => {
  const result = detectDtvReceiver({
    dtvReadyFlag: false,
    nativeBridge: { getDtvReceiverConnected: () => true },
  })
  assert.equal(result.connected, true)
  assert.equal(result.source, "native-bridge")
  assert.equal(result.preferVvc, true)
})

test("bridge nativa presente mas sem valor booleano (null): cai pro modo declarativo", () => {
  const result = detectDtvReceiver({
    dtvReadyFlag: true,
    nativeBridge: { getDtvReceiverConnected: () => null },
  })
  assert.equal(result.source, "declared-flag")
  assert.equal(result.connected, true)
})

test("bridge nativa sem método getDtvReceiverConnected: cai pro modo declarativo", () => {
  const result = detectDtvReceiver({ dtvReadyFlag: false, nativeBridge: {} })
  assert.equal(result.source, "none")
  assert.equal(result.connected, false)
})
