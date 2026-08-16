# DOOHPLAY — Textos comerciais: "TV 3.0 Ready" (Fase 45)

> Papel: Docs & Produto Agent DOOHPLAY. Ver `docs/dtv-ready-mvp-plano.md`
> pro plano técnico e `docs/api-contract.md` pro contrato da flag
> `dtv_ready`. Regra seguida neste documento: nunca prometer recepção de
> transmissão de TV 3.0 aberta hoje — só compatibilidade de player +
> declaração do instalador. Ver seção "O que isso NÃO é" antes de usar
> qualquer trecho abaixo com um cliente.

## O que isso É

- O player DOOHPLAY é compatível com o padrão TV 3.0 (DTV+) e prioriza o
  codec VVC quando a mídia estiver disponível nesse formato.
- Um selo visual "TV 3.0 Ready" no dashboard do cliente e no portal do
  anunciante, ativado quando o instalador confirma que existe um
  receptor/conversor DTV+ externo conectado àquela tela.
- Uma forma do anunciante identificar, na hora de montar uma campanha,
  quais telas já estão preparadas tecnicamente para o novo padrão.

## O que isso NÃO é

- **Não é** recepção de canal de TV aberta pela tela. Nenhuma TV vendida
  no Brasil tem chip DTV+ nativo hoje; existem apenas conversores
  externos. SBT e Record têm só estações-piloto em teste (sem confirmação
  de transmissão comercial própria).
- **Não é** detecção automática de hardware. Não existe API de navegador
  para consultar o que está conectado na cadeia HDMI de uma TV — o selo
  reflete uma declaração do instalador, não uma leitura de sensor.
- **Não é** datacasting nem distribuição de conteúdo via espectro de TV —
  isso depende de parceria de espectro, hoje inexistente, e fica em
  horizonte mais distante do roadmap.

## Texto para proposta comercial (copiar e adaptar)

> A tela [NOME DO CLIENTE] já roda no player DOOHPLAY, que é compatível
> com o novo padrão brasileiro de TV (TV 3.0 / DTV+), incluindo suporte
> priorizado ao codec de vídeo mais recente do setor (VVC). Isso significa
> que, à medida que o padrão avançar comercialmente no Brasil, essa tela
> já está tecnicamente preparada para acompanhar essa evolução — sem
> necessidade de trocar o player ou o software.
>
> Hoje o selo "TV 3.0 Ready" indica compatibilidade de player e, quando
> aplicável, a presença de um receptor ou conversor externo conectado à
> tela. A recepção de transmissão aberta de TV 3.0 depende de emissoras
> brasileiras transmitindo comercialmente na região — algo que ainda está
> em fase de teste no país.

## FAQ (mesmo conteúdo da página pública `/tv-3-0-ready`)

**Minha TV já recebe canais de TV 3.0 pelo ar com isso?**
Não. Significa que o player já é compatível e prioriza VVC — a recepção
real depende de transmissão comercial das emissoras (hoje só pilotos) e
de um conversor externo conectado.

**O que exatamente o selo confirma?**
Compatibilidade técnica do player + declaração do instalador sobre um
receptor externo conectado. Não é leitura automática de hardware.

**Preciso comprar algum equipamento?**
Só se quiser receber transmissão de TV 3.0 de verdade quando/onde ela
existir comercialmente — um conversor externo compatível. O DOOHPLAY não
vende nem exige esse equipamento.

**Isso muda o preço da assinatura?**
Não, na Fase Ready — é preparação técnica, sem cobrança adicional
associada até haver entrega de valor real e mensurável.

**Quando a recepção de transmissão aberta vai funcionar de verdade?**
Depende de fatores fora do nosso controle (emissoras, parceria de
espectro/middleware). Acompanhamos ativamente e atualizamos a
comunicação assim que houver mudança real — nunca antecipamos isso como
já disponível.

## Pendências / pontos que precisam de validação humana

- [ ] Confirmar se algum valor de upgrade será cobrado por este selo, e
      quando — decisão comercial/pricing do fundador, fora do escopo
      técnico deste documento.
- [ ] Confirmar se este texto substitui ou complementa o texto já
      existente no `Documento_Consolidado_Ideias_DOOHPLAY_DTV.docx`
      (frase pública "primeira plataforma brasileira de Digital Signage
      verdadeiramente híbrida" não foi reutilizada aqui de propósito —
      ver Documento-Mestre v4, seção 3.5, sobre a reconciliação de
      postura).
- [ ] Revisar com jurídico/compliance antes de usar em proposta formal
      com cliente, dado o histórico do projeto com a certificação ISO
      27001 removida por reivindicação não sustentável (10-12/07/2026) —
      mesma classe de risco que este documento tenta evitar.
