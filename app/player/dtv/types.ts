// app/player/dtv/types.ts
// Fase 45 (16/08/2026) — tipos do adapter de detecção de receptor DTV+.
// Ver docs/dtv-ready-mvp-plano.md (seção 3) para o porquê da abordagem
// declarativa: não existe API de browser padrão pra consultar
// dispositivos HDMI-CEC a jusante (ex: "há um conversor DTV+ plugado na
// mesma cadeia HDMI da TV?"). Um player rodando dentro de WebView/
// navegador não consegue "ver" isso sozinho — este adapter nunca finge
// o contrário.

export type DtvSignalSource = "native-bridge" | "declared-flag" | "none"

export interface DtvNativeBridge {
  // Hook opcional: se o app Android nativo (firestick-app/) um dia expor
  // essa ponte pra WebView (ex: via HdmiControlManager), o adapter passa
  // a usar sinal automático real em vez do modo declarativo. Hoje essa
  // ponte não existe — getNativeBridge() sempre resolve pra undefined em
  // qualquer ambiente atual.
  getDtvReceiverConnected?: () => boolean | null | undefined
}

export interface DtvDetectionInput {
  // Vem do campo dtv_ready da playlist (GET /api/client/playlist/{code}),
  // ver docs/api-contract.md — é uma declaração do instalador/operador no
  // admin, não uma leitura de hardware.
  dtvReadyFlag: boolean
  // Ponte nativa opcional. Parametrizada aqui (em vez de acessada direto
  // via window dentro da função principal) só pra facilitar teste sem
  // precisar simular um DOM inteiro.
  nativeBridge?: DtvNativeBridge
}

export interface DtvDetectionResult {
  connected: boolean
  source: DtvSignalSource
  // Infraestrutura pra quando existirem variantes de mídia codificadas em
  // VVC — hoje o pipeline de mídia (lib/publishMedia.ts, Studio, upload)
  // não gera nem seleciona variante de codec nenhuma, então este campo é
  // só o sinal de intenção; a seleção real de fonte de vídeo por codec é
  // trabalho futuro, fora do escopo deste MVP.
  preferVvc: boolean
}
