export const dynamic = "force-dynamic"

export function GET() {
  const html = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Materiais de Venda — DOOHPLAY</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:system-ui,-apple-system,sans-serif; background:#0F172A; color:#F1F5F9; }
nav { background:#1E293B; border-bottom:1px solid #334155; padding:0 24px; height:56px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
.logo { font-size:20px; font-weight:900; color:#F9FAFB; }
.logo span { color:#3B82F6; }
.tabs { display:flex; gap:4px; }
.tab { padding:6px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:transparent; color:#94A3B8; transition:all .2s; }
.tab.active { background:#3B82F6; color:white; }
.section { display:none; max-width:800px; margin:0 auto; padding:32px 24px; }
.section.active { display:block; }
.card { background:#1E293B; border:1px solid #334155; border-radius:16px; padding:28px; margin-bottom:24px; }
.card-title { font-size:18px; font-weight:800; color:#F1F5F9; margin-bottom:6px; }
.card-sub { font-size:13px; color:#64748B; margin-bottom:20px; }
.script-step { border-left:3px solid #3B82F6; padding:16px 20px; margin-bottom:16px; background:#0F172A; border-radius:0 10px 10px 0; }
.script-label { font-size:11px; font-weight:700; color:#3B82F6; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.script-text { font-size:14px; color:#CBD5E1; line-height:1.7; }
.script-text em { color:#F1F5F9; font-style:normal; font-weight:600; }
.objection { background:#1a0f00; border:1px solid #92400e33; border-radius:10px; padding:16px; margin-bottom:12px; }
.objection-q { font-size:13px; color:#fbbf24; font-weight:700; margin-bottom:6px; }
.objection-a { font-size:13px; color:#CBD5E1; line-height:1.6; }
.proposal-text { font-size:14px; color:#CBD5E1; line-height:1.8; white-space:pre-line; background:#0F172A; border-radius:10px; padding:16px; border:1px solid #334155; }
.copy-btn { display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:7px 14px; background:transparent; border:1px solid #334155; border-radius:8px; color:#64748B; font-size:12px; cursor:pointer; }
.copy-btn:hover { border-color:#3B82F6; color:#3B82F6; }
.slide { background:linear-gradient(135deg,#1E293B,#0F172A); border:1px solid #334155; border-radius:16px; padding:32px; margin-bottom:20px; }
.slide-tag { font-size:11px; font-weight:700; color:#3B82F6; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
.slide-headline { font-size:24px; font-weight:900; color:#F1F5F9; margin-bottom:12px; line-height:1.2; }
.slide-body { font-size:14px; color:#94A3B8; line-height:1.7; }
.slide-body strong { color:#F1F5F9; }
.stat-row { display:flex; gap:12px; margin-top:16px; flex-wrap:wrap; }
.stat { background:#0F172A; border:1px solid #334155; border-radius:10px; padding:14px 18px; flex:1; min-width:120px; text-align:center; }
.stat-num { font-size:28px; font-weight:900; color:#3B82F6; }
.stat-label { font-size:11px; color:#64748B; margin-top:2px; }
.highlight-box { background:linear-gradient(135deg,#1e3a5f,#1e1b4b); border:1px solid #3B82F6; border-radius:10px; padding:16px; margin-top:14px; font-size:14px; color:#BFDBFE; line-height:1.6; }
.price-row { display:flex; gap:12px; margin-top:16px; }
.price-card { flex:1; background:#0F172A; border:1px solid #334155; border-radius:12px; padding:16px; text-align:center; }
.price-card.featured { border-color:#3B82F6; background:#1e3a5f; }
.price-name { font-size:12px; font-weight:700; color:#64748B; margin-bottom:6px; }
.price-card.featured .price-name { color:#93C5FD; }
.price-value { font-size:24px; font-weight:900; color:#F1F5F9; }
.price-desc { font-size:11px; color:#64748B; margin-top:4px; }
.seg-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
.seg-tab { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #334155; background:transparent; color:#94A3B8; }
.seg-tab.active { background:#3B82F6; border-color:#3B82F6; color:white; }
@media(max-width:600px){ .price-row,.stat-row { flex-direction:column; } .tab { padding:6px 10px; font-size:12px; } }
</style>
</head>
<body>
<nav>
  <div class="logo">DOOH<span>PLAY</span></div>
  <div class="tabs">
    <button class="tab active" onclick="showSection('script',this)">📋 Script</button>
    <button class="tab" onclick="showSection('proposta',this)">💬 Proposta</button>
    <button class="tab" onclick="showSection('apresentacao',this)">📱 Apresentação</button>
  </div>
</nav>

<!-- SCRIPT -->
<div class="section active" id="script">
  <div style="margin-bottom:28px">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:6px">Script de Abordagem</h1>
    <p style="font-size:14px;color:#64748B">O que falar do primeiro contato até o fechamento</p>
  </div>

  <div class="seg-tabs">
    <button class="seg-tab active" onclick="changeScript('geral',this)">Todos</button>
    <button class="seg-tab" onclick="changeScript('barbearia',this)">✂️ Barbearia/Salão</button>
    <button class="seg-tab" onclick="changeScript('farmacia',this)">💊 Farmácia/Clínica</button>
    <button class="seg-tab" onclick="changeScript('lanchonete',this)">🍔 Lanchonete/Rest.</button>
  </div>

  <div class="card">
    <div class="card-title">🚶 Passo 1 — Entrada no estabelecimento</div>
    <div class="card-sub">Primeiros 30 segundos — o mais importante</div>
    <div class="script-step">
      <div class="script-label">Você diz</div>
      <div class="script-text">"Oi, tudo bem? Meu nome é [SEU NOME], sou da <em>DOOHPLAY</em>. Tenho uma solução que está ajudando estabelecimentos aqui do bairro a <em>ganhar dinheiro extra com a TV</em> que já têm — sem custo nenhum pra começar. Você tem 2 minutinhos pra eu te mostrar?"</div>
    </div>
    <div class="script-step" style="border-color:#10B981">
      <div class="script-label" style="color:#10B981">Dica</div>
      <div class="script-text">Se tiver o vídeo da Barbearia Zimermam no celular, mostre já na entrada. Uma imagem vale mais que qualquer explicação.</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📱 Passo 2 — Demonstração (2 minutos)</div>
    <div class="card-sub">Mostre o produto funcionando de verdade</div>
    <div class="script-step">
      <div class="script-label">Você diz</div>
      <div class="script-text">"Olha, é simples assim: <em>você instala um app gratuito na sua TV</em>, conecta na internet, e começa a exibir o seu próprio conteúdo — promoções, cardápio, o que quiser.<br><br>Mas além disso, <em>anunciantes locais pagam pra aparecer na sua tela</em>. Farmácia, banco, iFood — eles querem aparecer pra quem está aqui nesse bairro. E você recebe por cada exibição."</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">💰 Passo 3 — Apresentar os números</div>
    <div class="card-sub">Torne concreto o ganho potencial</div>
    <div class="script-step">
      <div class="script-label" id="seg-label">Para qualquer estabelecimento</div>
      <div class="script-text" id="seg-text">Um estabelecimento com bom movimento pode ter entre <em>800 e 1.500 exibições por dia</em>. Com anunciantes rodando, isso representa em torno de <em>R$ 200 a R$ 500 por mês</em> de receita extra.<br><br>O plano começa em <em>R$ 97 por mês</em>. Na maioria dos casos o primeiro anunciante já paga o plano no primeiro mês.</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">🤝 Passo 4 — Fechamento</div>
    <div class="card-sub">Peça o sim de forma natural</div>
    <div class="script-step">
      <div class="script-label">Você diz</div>
      <div class="script-text">"O que eu preciso de você pra começar hoje é só: <em>nome do estabelecimento, WhatsApp e email</em>. A instalação leva 15 minutos e você já começa a exibir seu conteúdo hoje mesmo. Quer começar?"</div>
    </div>
    <div class="script-step" style="border-color:#10B981">
      <div class="script-label" style="color:#10B981">Se hesitar</div>
      <div class="script-text">"Que tal eu instalar agora e você vê funcionando? Se não gostar nos primeiros 7 dias, cancela sem custo nenhum."</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">🛡️ Objeções comuns — Como responder</div>
    <div class="card-sub">Esteja preparado para as dúvidas mais frequentes</div>
    <div class="objection">
      <div class="objection-q">"Não tenho tempo pra isso agora"</div>
      <div class="objection-a">Entendo. A instalação leva 15 minutos e depois é automático. Posso voltar amanhã de manhã antes de você abrir?</div>
    </div>
    <div class="objection">
      <div class="objection-q">"R$ 97 por mês é caro"</div>
      <div class="objection-a">Se o primeiro anunciante local pagar R$ 150 pra aparecer na sua TV, você já lucrou R$ 53 esse mês. Na maioria dos casos o plano se paga no primeiro mês.</div>
    </div>
    <div class="objection">
      <div class="objection-q">"Não sei mexer com tecnologia"</div>
      <div class="objection-a">Não precisa saber nada. Eu instalo tudo pra você, você só liga a TV. Se precisar de qualquer coisa, é só me chamar no WhatsApp.</div>
    </div>
    <div class="objection">
      <div class="objection-q">"Deixa eu pensar"</div>
      <div class="objection-a">Claro! Vou te mandar um vídeo no WhatsApp mostrando funcionando de verdade. Qual o seu número? (Capture o contato e cadastre no CRM)</div>
    </div>
    <div class="objection">
      <div class="objection-q">"Já tenho uma TV com conteúdo"</div>
      <div class="objection-a">Perfeito! O DOOHPLAY funciona junto — você continua passando seu conteúdo e ainda monetiza com anunciantes. É uma renda a mais.</div>
    </div>
  </div>
</div>

<!-- PROPOSTA -->
<div class="section" id="proposta">
  <div style="margin-bottom:28px">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:6px">Proposta Comercial</h1>
    <p style="font-size:14px;color:#64748B">Mensagens prontas para enviar por WhatsApp</p>
  </div>

  <div class="card">
    <div class="card-title">💬 Primeiro contato (frio)</div>
    <div class="card-sub">Envie antes da visita ou quando não conseguir falar pessoalmente</div>
    <div class="proposal-text" id="msg1">Oi [NOME]! Tudo bem? 😊

Sou [SEU NOME] da DOOHPLAY.

Estou passando nos estabelecimentos do bairro pra apresentar uma solução que está ajudando a ganhar dinheiro extra com a TV da sala de espera.

Em resumo: anunciantes locais (farmácias, bancos, delivery) pagam pra aparecer na tela enquanto seus clientes aguardam. Você recebe por cada exibição, sem fazer nada além de deixar a TV ligada.

Posso te mostrar em 2 minutos como funciona? Tenho um vídeo de um estabelecimento aqui do bairro que já está usando. 📺</div>
    <button class="copy-btn" onclick="copy('msg1',this)">📋 Copiar mensagem</button>
  </div>

  <div class="card">
    <div class="card-title">📄 Proposta formal (após visita)</div>
    <div class="card-sub">Envie no mesmo dia da visita</div>
    <div class="proposal-text" id="msg2">Oi [NOME]! Foi um prazer te conhecer hoje 😊

Segue o resumo do que conversamos sobre o DOOHPLAY:

📺 O que é:
Sistema que transforma sua TV em mídia digital. Você exibe seu próprio conteúdo E recebe por anúncios de empresas locais.

💰 Quanto você pode ganhar:
- 800 a 1.500 exibições/dia
- R$ 200 a R$ 500/mês em receita extra
- O plano se paga com o primeiro anunciante

📦 Plano Starter — R$ 97/mês:
✅ 1 TV conectada
✅ Dashboard de controle pelo celular
✅ Suporte via WhatsApp
✅ Instalação inclusa (15 minutos)

🎯 Próximo passo:
Posso instalar ainda essa semana. Você não precisa fazer nada — eu cuido de tudo.

Quer confirmar a instalação? É só me responder aqui 👇</div>
    <button class="copy-btn" onclick="copy('msg2',this)">📋 Copiar mensagem</button>
  </div>

  <div class="card">
    <div class="card-title">🔁 Follow-up (2 dias depois)</div>
    <div class="card-sub">Quando não houve resposta após a proposta</div>
    <div class="proposal-text" id="msg3">Oi [NOME]! Tudo bem? 👋

Passando pra saber se teve alguma dúvida sobre o DOOHPLAY.

Deixa eu te mandar o link pra você ver como seria o painel de controle da sua TV:
👉 doohplay.com.br

Qualquer pergunta é só falar. Se quiser, posso passar aí essa semana ainda pra uma demonstração rápida 🙂</div>
    <button class="copy-btn" onclick="copy('msg3',this)">📋 Copiar mensagem</button>
  </div>

  <div class="card">
    <div class="card-title">🎉 Boas-vindas (após fechamento)</div>
    <div class="card-sub">Envie assim que o cliente fechar</div>
    <div class="proposal-text" id="msg4">Oi [NOME]! Seja bem-vindo ao DOOHPLAY! 🎉📺

Sua TV está configurada e pronta pra usar.

Seus dados de acesso:

🔑 Seu código de tela: [CODIGO]
📱 Dashboard: doohplay.com.br/dashboard/local/[CODIGO]
📖 Guia de uso: doohplay.com.br/guia-uso
📲 Instalar app na TV: doohplay.com.br/instalar/[CODIGO]

Qualquer dúvida, é só me chamar aqui no WhatsApp. Bem-vindo à rede! 🚀</div>
    <button class="copy-btn" onclick="copy('msg4',this)">📋 Copiar mensagem</button>
  </div>
</div>

<!-- APRESENTAÇÃO -->
<div class="section" id="apresentacao">
  <div style="margin-bottom:28px">
    <h1 style="font-size:24px;font-weight:900;margin-bottom:6px">Apresentação Visual</h1>
    <p style="font-size:14px;color:#64748B">Mostre no celular durante a visita — slides simples e diretos</p>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 1 — Abertura</div>
    <div class="slide-headline">Sua TV pode estar<br>gerando renda agora</div>
    <div class="slide-body">Enquanto seus clientes esperam, a TV fica parada. A DOOHPLAY conecta você com anunciantes locais que pagam pra aparecer nessa tela.</div>
    <div class="highlight-box">📺 Sem trocar a TV · Sem obra · Sem complicação</div>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 2 — Como funciona</div>
    <div class="slide-headline">3 passos para começar</div>
    <div class="slide-body">
      <strong>1. Instalamos o app na sua TV</strong> — leva 15 minutos<br><br>
      <strong>2. Você envia seu conteúdo</strong> — promoções, cardápio, avisos<br><br>
      <strong>3. Anunciantes locais aparecem na sua tela</strong> — e você recebe por cada exibição
    </div>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 3 — Estimativa</div>
    <div class="slide-headline">O que você pode ganhar</div>
    <div class="stat-row">
      <div class="stat"><div class="stat-num">1.2K</div><div class="stat-label">exibições/dia (exemplo)</div></div>
      <div class="stat"><div class="stat-num">R$350</div><div class="stat-label">receita/mês (exemplo)</div></div>
      <div class="stat"><div class="stat-num">15min</div><div class="stat-label">instalação</div></div>
    </div>
    <div class="slide-body" style="margin-top:14px">Exemplo ilustrativo pra um estabelecimento com movimento de segunda a sábado e TV ligada no horário comercial — o valor real varia por local e demanda de anunciantes.</div>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 4 — Prova social</div>
    <div class="slide-headline">Já funcionando aqui no bairro</div>
    <div class="slide-body">
      <strong>Barbearia Zimermam</strong> — instalado e funcionando<br>
      TV online · Conteúdo rodando · Primeiros anunciantes chegando<br><br>
      <em style="color:#3B82F6">"A instalação foi rápida e o painel é fácil de usar."</em><br>
      — Gilson, dono da Barbearia Zimermam
    </div>
    <div class="highlight-box">🎥 Peça pra ver o vídeo da TV funcionando ao vivo</div>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 5 — Planos</div>
    <div class="slide-headline">Comece por R$ 97/mês</div>
    <div class="price-row">
      <div class="price-card featured"><div class="price-name">STARTER</div><div class="price-value">R$97</div><div class="price-desc">/mês · 1 TV</div></div>
      <div class="price-card"><div class="price-name">PRO</div><div class="price-value">R$290</div><div class="price-desc">/mês · 3 TVs · Relatórios</div></div>
      <div class="price-card"><div class="price-name">BUSINESS</div><div class="price-value">R$620</div><div class="price-desc">/mês · 5 TVs</div></div>
    </div>
    <div class="slide-body" style="margin-top:14px">O plano Starter se paga com o primeiro anunciante local. Cancele quando quiser.</div>
  </div>

  <div class="slide">
    <div class="slide-tag">Slide 6 — Ação</div>
    <div class="slide-headline">Instalo hoje.<br>Você decide amanhã.</div>
    <div class="slide-body">
      Instalação gratuita · 7 dias para experimentar · Suporte via WhatsApp<br><br>
      <strong>O que preciso de você agora:</strong><br>
      Nome · WhatsApp · Email
    </div>
    <div class="highlight-box" style="text-align:center;font-size:16px;font-weight:700">doohplay.com.br</div>
  </div>
</div>

<script>
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  btn.classList.add('active')
}

function changeScript(seg, btn) {
  document.querySelectorAll('.seg-tab').forEach(t => t.classList.remove('active'))
  btn.classList.add('active')
  const data = {
    geral: {
      label: 'Para qualquer estabelecimento',
      text: 'Um estabelecimento com bom movimento pode ter entre <em>800 e 1.500 exibições por dia</em>. Com anunciantes rodando, isso representa em torno de <em>R$ 200 a R$ 500 por mês</em> de receita extra.<br><br>O plano começa em <em>R$ 97 por mês</em>. Na maioria dos casos o primeiro anunciante já paga o plano no primeiro mês.'
    },
    barbearia: {
      label: 'Para barbearia/salão',
      text: 'Uma barbearia com atendimento de segunda a sábado pode ter até <em>1.500 exibições por dia</em>. Anunciantes como produtos de beleza, farmácias e delivery pagam bem pra aparecer pra esse público.<br><br>Em média: <em>R$ 300 a R$ 500 por mês</em>. O plano de <em>R$ 97 se paga no primeiro anunciante</em>.'
    },
    farmacia: {
      label: 'Para farmácia/clínica',
      text: 'Farmácias e clínicas têm público de alta renda e tempo de espera de 10 a 30 minutos — <em>perfil ideal para anunciantes premium</em>. Planos de saúde, laboratórios e seguros pagam mais por esse público.<br><br>Potencial de <em>R$ 400 a R$ 800 por mês</em> com anunciantes do setor saúde.'
    },
    lanchonete: {
      label: 'Para lanchonete/restaurante',
      text: 'Restaurantes têm pico no almoço e jantar — <em>horários de ouro para anúncios de delivery, bebidas e sobremesas</em>. A TV pode exibir o cardápio e ainda monetizar com parceiros locais.<br><br>Potencial de <em>R$ 250 a R$ 450 por mês</em> em receita extra.'
    }
  }
  document.getElementById('seg-label').textContent = data[seg].label
  document.getElementById('seg-text').innerHTML = data[seg].text
}

function copy(id, btn) {
  const text = document.getElementById(id).textContent
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent
    btn.textContent = '✅ Copiado!'
    setTimeout(() => btn.textContent = orig, 2000)
  })
}
</script>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  })
}
