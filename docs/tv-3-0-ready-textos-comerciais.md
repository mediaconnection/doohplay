# DOOHPLAY — Textos comerciais: "TV 3.0 Ready" (Fase 45)

> Papel: Docs & Produto Agent DOOHPLAY. Ver `docs/dtv-ready-mvp-plano.md`
> pro plano técnico e `docs/api-contract.md` pro contrato da flag
> `dtv_ready`. Regra seguida neste documento: nunca prometer recepção de
> transmissão de TV 3.0 aberta hoje — só compatibilidade de player +
> declaração do instalador. Ver seção "O que isso NÃO é" antes de usar
> qualquer trecho abaixo com um cliente.

## O que isso É

- O player DOOHPLAY é compatível com o padrão TV 3.0 (DTV+). Suporte ao
  codec VVC está em preparação — a seleção automática de variante de
  mídia por codec ainda não está ativa (ver "O que isso NÃO é").
- Um selo visual "TV 3.0 Ready" no dashboard do cliente e no portal do
  anunciante, ativado quando o instalador confirma que existe um
  receptor/conversor DTV+ externo conectado àquela tela.
- Uma forma do anunciante identificar, na hora de montar uma campanha,
  quais telas já estão preparadas tecnicamente para o novo padrão.

## O que isso NÃO é

- **Não é** seleção automática de vídeo em VVC. O pipeline de mídia
  (Studio, upload) ainda não gera nem armazena variantes por codec — o
  campo que sinaliza preferência por VVC existe no código como
  infraestrutura, mas nada consome esse sinal ainda.
- **Não é** recepção de canal de TV aberta pela tela. Nenhuma TV vendida
  no Brasil tem chip DTV+ nativo hoje; existem apenas conversores
  externos. **Atualização (16/08/2026):** a Globo já fez a primeira
  transmissão comercial de TV 3.0 do país durante a Copa do Mundo 2026,
  hoje restrita a Rio de Janeiro, São Paulo e Brasília e dependente de
  receptor compatível; SBT e Record seguem com estações-piloto em teste.
- **Não é** detecção automática de hardware. Não existe API de navegador
  para consultar o que está conectado na cadeia HDMI de uma TV — o selo
  reflete uma declaração do instalador, não uma leitura de sensor.
- **Não é** decodificação do sinal de TV 3.0 pelo player DOOHPLAY. Quem
  decodifica a transmissão é o conversor/receptor externo — hardware de
  terceiro, sem nenhuma relação de software com o DOOHPLAY. O player não
  processa esse sinal; ele só reflete a configuração cadastrada e mostra
  o selo.
- **Não é** datacasting nem distribuição de conteúdo via espectro de TV —
  isso depende de parceria de espectro, hoje inexistente, e fica em
  horizonte mais distante do roadmap.

## Texto para proposta comercial (copiar e adaptar)

> A tela [NOME DO CLIENTE] já roda no player DOOHPLAY, que sinaliza
> compatibilidade com o novo padrão brasileiro de TV (TV 3.0 / DTV+) e vai
> priorizar o codec de vídeo mais recente do setor (VVC) assim que esse
> suporte for lançado. Isso significa que essa tela já está tecnicamente
> preparada para acompanhar essa evolução sem precisar trocar o hardware
> — atualizações de software, quando saírem, chegam automaticamente, sem
> custo extra de instalação. (Quem decodifica a transmissão de TV 3.0 em
> si é o conversor externo, não o player DOOHPLAY.)
>
> Hoje o selo "TV 3.0 Ready" indica compatibilidade de player e, quando
> aplicável, a presença de um receptor ou conversor externo conectado à
> tela. A TV 3.0 já teve sua primeira transmissão comercial no Brasil
> (Globo, Copa do Mundo 2026), hoje limitada a Rio de Janeiro, São Paulo
> e Brasília e a quem tem receptor compatível — a expansão pra mais
> praças e emissoras ainda está em andamento.

## FAQ (mesmo conteúdo da página pública `/tv-3-0-ready`)

**Minha TV já recebe canais de TV 3.0 pelo ar com isso?**
Não. Significa que o player já é compatível, com suporte a VVC em
preparação — a recepção real depende de transmissão comercial das
emissoras na sua região e de um conversor externo conectado. A Globo já
transmitiu a Copa do Mundo 2026 em TV 3.0, hoje limitada a Rio de
Janeiro, São Paulo e Brasília.

**O que exatamente o selo confirma?**
Duas coisas, nenhuma delas é decodificar o sinal de TV 3.0: (1) que o
instalador confirmou, no cadastro da tela, que existe um receptor ou
conversor DTV+ externo conectado a ela, e (2) que o player já suporta
mostrar esse selo e, quando o suporte a VVC estiver ativo, priorizar essa
variante nos próprios conteúdos exibidos. Quem decodifica a transmissão
de TV 3.0 é o conversor externo — hardware de terceiro, não o DOOHPLAY.
Não é leitura automática de hardware.

**Preciso comprar algum equipamento?**
Só se quiser receber transmissão de TV 3.0 de verdade onde ela já
existir comercialmente — um conversor externo compatível. O DOOHPLAY não
vende nem exige esse equipamento.

**Isso muda o preço da assinatura?**
Não há cobrança adicional confirmada nesta fase. O preço específico
dessa fase ainda não foi definido — se isso mudar, comunicamos antes de
qualquer cobrança.

**Quando a recepção de transmissão aberta vai funcionar de verdade?**
Já começou de forma limitada — a Globo transmitiu a Copa do Mundo 2026
em TV 3.0, restrita a Rio de Janeiro, São Paulo e Brasília e a quem tem
receptor compatível. Expansão pra mais praças e emissoras (SBT, Record)
depende de fatores fora do nosso controle; acompanhamos ativamente e
atualizamos essa comunicação conforme evolui.

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

## Correção (16/08/2026)

Revisão de conteúdo (não substitui revisão jurídica formal) encontrou e
corrigiu 3 pontos nesta versão:
1. O texto original dizia que o player "prioriza o codec VVC" como se
   fosse uma feature ativa — corrigido pra "suporte em preparação", já
   que o pipeline de mídia ainda não gera/seleciona variante por codec.
2. O texto original dizia que SBT/Record tinham só estações-piloto sem
   nenhuma transmissão comercial — desatualizado: a Globo já fez a
   primeira transmissão comercial de TV 3.0 do país na Copa do Mundo
   2026 (limitada a RJ/SP/Brasília). Corrigido em todas as ocorrências.
3. A resposta de FAQ sobre preço dizia "Não" de forma categórica,
   contradizendo a pendência acima sobre pricing ainda não decidido —
   suavizado pra não virar promessa quebrada se o preço mudar.

## Revisão de conteúdo à luz do CDC art. 37 (16/08/2026, 2ª passada)

Revisão de conteúdo (não substitui revisão jurídica formal — não sou
advogado) usando como referência o art. 37 do CDC, que proíbe publicidade
enganosa inclusive por omissão de dado essencial. Encontrou 2 pontos
ainda não cobertos pela correção anterior, ambos já corrigidos nesta
versão:
1. "Player compatível" / "player pronto tecnicamente" podia ser lido como
   "o player decodifica o sinal de TV 3.0", o que não é real — quem
   decodifica é o conversor externo (hardware de terceiro). Adicionado um
   item explícito em "O que isso NÃO é" e reescrita a resposta do FAQ
   "O que exatamente o selo confirma?" pra deixar essa distinção clara.
2. "Sem necessidade de trocar o player ou o software" podia ser lido como
   "nenhuma atualização nunca mais" — impreciso, já que o suporte a VVC,
   quando existir, ainda vai exigir uma atualização de software (só não
   troca de hardware). Reescrito no texto de proposta comercial.
