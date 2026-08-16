export const dynamic = "force-dynamic"

export function GET() {
  const html = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>DOOHPLAY — Apresentação</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html, body { width:100%; height:100%; overflow:hidden; background:#0B1120; font-family:system-ui,-apple-system,sans-serif; color:#F1F5F9; }

.deck { width:100%; height:100vh; position:relative; overflow:hidden; }

.slide {
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:32px 28px;
  opacity:0; transform:translateX(100%);
  transition:transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s;
  pointer-events:none;
}
.slide.active { opacity:1; transform:translateX(0); pointer-events:all; }
.slide.prev { opacity:0; transform:translateX(-100%); }

/* BACKGROUNDS por slide */
.slide-1 { background:linear-gradient(145deg,#0B1120 0%,#0f1f3d 100%); }
.slide-2 { background:linear-gradient(145deg,#0B1120 0%,#1a0f2e 100%); }
.slide-3 { background:linear-gradient(145deg,#0B1120 0%,#0f2a1a 100%); }
.slide-4 { background:linear-gradient(145deg,#0B1120 0%,#2a1a00 100%); }
.slide-5 { background:linear-gradient(145deg,#0B1120 0%,#1a1a2e 100%); }
.slide-6 { background:linear-gradient(145deg,#0B1120 0%,#0f1f3d 100%); }

.slide-num {
  position:absolute; top:20px; left:24px;
  font-size:11px; font-weight:700; color:#334155;
  text-transform:uppercase; letter-spacing:2px;
}
.logo-small {
  position:absolute; top:18px; right:24px;
  font-size:14px; font-weight:900; color:#F9FAFB;
}
.logo-small span { color:#3B82F6; }

.tag { font-size:11px; font-weight:700; color:#3B82F6; text-transform:uppercase; letter-spacing:2px; margin-bottom:16px; text-align:center; }
.headline { font-size:clamp(28px,8vw,42px); font-weight:900; line-height:1.1; text-align:center; margin-bottom:16px; }
.sub { font-size:15px; color:#94A3B8; text-align:center; line-height:1.6; max-width:340px; }
.sub strong { color:#F1F5F9; }

.stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%; max-width:340px; margin:20px 0; }
.stat { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:18px 12px; text-align:center; }
.stat-num { font-size:32px; font-weight:900; color:#3B82F6; }
.stat-label { font-size:11px; color:#64748B; margin-top:4px; }

.steps { width:100%; max-width:360px; display:flex; flex-direction:column; gap:14px; }
.step { display:flex; align-items:flex-start; gap:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:16px; }
.step-num { width:32px; height:32px; border-radius:50%; background:#3B82F6; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; flex-shrink:0; }
.step-text { font-size:14px; color:#CBD5E1; line-height:1.5; }
.step-text strong { color:#F1F5F9; display:block; margin-bottom:2px; }

.highlight { background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.15)); border:1px solid rgba(59,130,246,0.3); border-radius:14px; padding:18px 20px; text-align:center; font-size:14px; color:#BFDBFE; line-height:1.6; max-width:340px; margin-top:16px; }

.quote { font-size:16px; font-style:italic; color:#CBD5E1; text-align:center; line-height:1.6; max-width:320px; margin-bottom:12px; }
.quote-author { font-size:12px; color:#64748B; text-align:center; }

.price-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; width:100%; max-width:360px; margin:16px 0; }
.price-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:16px 8px; text-align:center; }
.price-card.featured { background:rgba(59,130,246,0.15); border-color:rgba(59,130,246,0.4); }
.price-name { font-size:10px; font-weight:700; color:#64748B; margin-bottom:6px; }
.price-card.featured .price-name { color:#93C5FD; }
.price-val { font-size:20px; font-weight:900; color:#F1F5F9; }
.price-period { font-size:10px; color:#64748B; margin-top:3px; }

.cta-box { background:linear-gradient(135deg,#3B82F6,#6366F1); border-radius:16px; padding:20px 24px; text-align:center; max-width:340px; margin-top:16px; }
.cta-box .title { font-size:18px; font-weight:900; margin-bottom:8px; }
.cta-box .items { font-size:14px; color:rgba(255,255,255,0.85); line-height:1.8; }

/* NAVEGAÇÃO */
.nav {
  position:fixed; bottom:0; left:0; right:0;
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 24px 28px;
  background:linear-gradient(to top, rgba(11,17,32,0.95) 0%, transparent 100%);
}
.nav-btn {
  width:48px; height:48px; border-radius:50%;
  background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
  color:#F1F5F9; font-size:20px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:all .2s;
}
.nav-btn:hover { background:rgba(59,130,246,0.3); border-color:#3B82F6; }
.nav-btn:disabled { opacity:0.2; cursor:default; }
.dots { display:flex; gap:6px; }
.dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.2); transition:all .3s; }
.dot.active { background:#3B82F6; width:18px; border-radius:3px; }
</style>
</head>
<body>

<div class="deck" id="deck">

  <!-- SLIDE 1 — Abertura -->
  <div class="slide slide-1 active">
    <div class="slide-num">01 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Para donos de estabelecimento</div>
    <div class="headline">Sua TV pode estar<br>gerando renda<br><span style="color:#3B82F6">agora</span></div>
    <div class="sub">Enquanto seus clientes esperam, a TV fica parada. A DOOHPLAY conecta você com <strong>anunciantes locais</strong> que pagam pra aparecer nessa tela.</div>
    <div class="highlight">📺 Sem trocar a TV · Sem obra · Sem complicação</div>
  </div>

  <!-- SLIDE 2 — Como funciona -->
  <div class="slide slide-2">
    <div class="slide-num">02 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Como funciona</div>
    <div class="headline" style="font-size:clamp(24px,6vw,36px);margin-bottom:20px">3 passos para começar</div>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Instalamos o app na sua TV</strong>Leva 15 minutos. Você não precisa fazer nada.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Você envia seu conteúdo</strong>Promoções, cardápio, avisos — pelo celular.</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Anunciantes aparecem na sua tela</strong>E você recebe por cada exibição.</div>
      </div>
    </div>
  </div>

  <!-- SLIDE 3 — Números -->
  <div class="slide slide-3">
    <div class="slide-num">03 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Estimativa</div>
    <div class="headline" style="font-size:clamp(24px,6vw,36px)">O que você<br>pode ganhar</div>
    <div class="stat-grid">
      <div class="stat"><div class="stat-num">1.2K</div><div class="stat-label">exibições/dia (exemplo)</div></div>
      <div class="stat"><div class="stat-num">R$350</div><div class="stat-label">receita/mês (exemplo)</div></div>
      <div class="stat"><div class="stat-num">15min</div><div class="stat-label">instalação</div></div>
      <div class="stat"><div class="stat-num">0</div><div class="stat-label">trabalho extra</div></div>
    </div>
    <div class="sub">Exemplo ilustrativo pra um estabelecimento com movimento de segunda a sábado e TV ligada no horário comercial — o valor real varia por local e demanda de anunciantes.</div>
  </div>

  <!-- SLIDE 4 — Prova social -->
  <div class="slide slide-4">
    <div class="slide-num">04 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Já funcionando aqui no bairro</div>
    <div class="headline" style="font-size:clamp(22px,5vw,32px);margin-bottom:20px">Barbearia Zimermam<br><span style="color:#10B981">● Online agora</span></div>
    <div class="quote">"A instalação foi rápida e o painel é fácil de usar. Já está exibindo meu conteúdo e os primeiros anunciantes estão chegando."</div>
    <div class="quote-author">— Gilson, dono da Barbearia Zimermam · São Paulo</div>
    <div class="highlight">🎥 Posso mostrar a TV funcionando ao vivo agora</div>
  </div>

  <!-- SLIDE 5 — Planos -->
  <div class="slide slide-5">
    <div class="slide-num">05 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Investimento</div>
    <div class="headline" style="font-size:clamp(24px,6vw,36px)">Comece por<br><span style="color:#3B82F6">R$ 97/mês</span></div>
    <div class="price-grid">
      <div class="price-card featured">
        <div class="price-name">STARTER</div>
        <div class="price-val">R$97</div>
        <div class="price-period">/mês · 1 TV</div>
      </div>
      <div class="price-card">
        <div class="price-name">PRO</div>
        <div class="price-val">R$290</div>
        <div class="price-period">/mês · 3 TVs</div>
      </div>
      <div class="price-card">
        <div class="price-name">BUSINESS</div>
        <div class="price-val">R$620</div>
        <div class="price-period">/mês · 5 TVs</div>
      </div>
    </div>
    <div class="sub">O plano Starter se paga com o <strong>primeiro anunciante local</strong>. Cancele quando quiser, sem multa.</div>
  </div>

  <!-- SLIDE 6 — CTA -->
  <div class="slide slide-6">
    <div class="slide-num">06 / 06</div>
    <div class="logo-small">DOOH<span>PLAY</span></div>
    <div class="tag">Próximo passo</div>
    <div class="headline" style="font-size:clamp(26px,7vw,40px)">Instalo hoje.<br>Você decide<br><span style="color:#3B82F6">amanhã.</span></div>
    <div class="cta-box">
      <div class="title">O que preciso de você:</div>
      <div class="items">📛 Nome do estabelecimento<br>📱 WhatsApp<br>📧 Email</div>
    </div>
    <div class="sub" style="margin-top:16px;font-size:13px">Instalação gratuita · 7 dias para experimentar<br>Suporte via WhatsApp incluído</div>
  </div>

</div>

<!-- NAVEGAÇÃO -->
<div class="nav">
  <button class="nav-btn" id="btn-prev" onclick="go(-1)" disabled>←</button>
  <div class="dots" id="dots"></div>
  <button class="nav-btn" id="btn-next" onclick="go(1)">→</button>
</div>

<script>
var current = 0
var slides = document.querySelectorAll('.slide')
var total = slides.length

// Dots
var dotsEl = document.getElementById('dots')
for (var i = 0; i < total; i++) {
  var d = document.createElement('div')
  d.className = 'dot' + (i === 0 ? ' active' : '')
  dotsEl.appendChild(d)
}

function go(dir) {
  var next = current + dir
  if (next < 0 || next >= total) return
  slides[current].classList.remove('active')
  slides[current].classList.add(dir > 0 ? 'prev' : '')
  current = next
  slides[current].classList.remove('prev')
  slides[current].classList.add('active')
  // Remove prev class after animation
  var prev = current - dir
  setTimeout(function() {
    if (slides[prev]) slides[prev].classList.remove('prev')
  }, 400)
  // Dots
  document.querySelectorAll('.dot').forEach(function(d, i) {
    d.classList.toggle('active', i === current)
  })
  document.getElementById('btn-prev').disabled = current === 0
  document.getElementById('btn-next').disabled = current === total - 1
}

// Swipe
var startX = 0
document.getElementById('deck').addEventListener('touchstart', function(e) {
  startX = e.touches[0].clientX
})
document.getElementById('deck').addEventListener('touchend', function(e) {
  var diff = startX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
})

// Teclado
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1)
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1)
})
</script>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  })
}
