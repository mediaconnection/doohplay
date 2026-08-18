export const dynamic = "force-dynamic"

export function GET() {
  const html = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DOOHPLAY para o setor Automotivo — Transforme a TV da recepção em renda extra</title>
<meta name="description" content="Seu cliente já espera enquanto o carro é atendido. Coloque uma TV, mostre seus serviços — e ainda ganhe dinheiro com anúncios enquanto ele aguarda.">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:system-ui,-apple-system,sans-serif; background:#0B1120; color:#F1F5F9; overflow-x:hidden; }

/* NAV */
nav { padding:16px 24px; display:flex; align-items:center; justify-content:space-between; max-width:960px; margin:0 auto; }
.logo { font-size:20px; font-weight:900; color:#F9FAFB; text-decoration:none; }
.logo span { color:#3B82F6; }
.nav-cta { background:#3B82F6; color:white; padding:8px 20px; border-radius:20px; font-size:13px; font-weight:700; text-decoration:none; }

/* HERO */
.hero { text-align:center; padding:48px 24px 40px; max-width:700px; margin:0 auto; }
.hero-tag { display:inline-block; background:#1e3a5f; color:#60A5FA; border:1px solid #3B82F644; border-radius:20px; padding:6px 16px; font-size:12px; font-weight:700; margin-bottom:20px; }
.hero h1 { font-size:clamp(32px,6vw,56px); font-weight:900; line-height:1.1; margin-bottom:20px; }
.hero h1 span { color:#3B82F6; }
.hero p { font-size:18px; color:#94A3B8; line-height:1.6; margin-bottom:32px; max-width:520px; margin-left:auto; margin-right:auto; }
.hero-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.btn-main { background:linear-gradient(135deg,#3B82F6,#6366F1); color:white; padding:16px 32px; border-radius:14px; font-size:16px; font-weight:700; text-decoration:none; display:inline-block; }
.btn-sec { background:transparent; color:#94A3B8; padding:16px 24px; border-radius:14px; font-size:15px; font-weight:600; text-decoration:none; border:1px solid #334155; display:inline-block; }

/* TV VISUAL */
.tv-section { padding:40px 24px; display:flex; justify-content:center; }
.tv-wrap { position:relative; max-width:500px; width:100%; }
.tv-frame { background:#1E293B; border:3px solid #334155; border-radius:16px; padding:16px; position:relative; }
.tv-screen { background:#0B1120; border-radius:10px; aspect-ratio:16/9; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; }
.tv-content { text-align:center; }
.tv-content .promo { font-size:clamp(14px,3vw,22px); font-weight:900; color:#F1F5F9; margin-bottom:6px; }
.tv-content .sub { font-size:clamp(10px,2vw,14px); color:#94A3B8; }
.tv-badge { position:absolute; top:12px; right:12px; background:#10B981; color:white; font-size:10px; font-weight:700; padding:4px 10px; border-radius:10px; }
.tv-ad { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(135deg,#1e3a5f,#1e1b4b); border-top:2px solid #3B82F6; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; }
.tv-ad-text { font-size:clamp(9px,1.5vw,12px); color:#93C5FD; }
.tv-ad-logo { font-size:clamp(9px,1.5vw,11px); font-weight:700; color:#60A5FA; }
.tv-stand { width:60px; height:10px; background:#334155; border-radius:4px; margin:0 auto 4px; }
.tv-base { width:100px; height:6px; background:#334155; border-radius:4px; margin:0 auto; }
.money-badge { position:absolute; top:-16px; right:-16px; background:#10B981; color:white; border-radius:50%; width:64px; height:64px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:700; line-height:1.2; box-shadow:0 4px 20px rgba(16,185,129,0.4); }

/* COMO FUNCIONA */
.section { padding:48px 24px; max-width:700px; margin:0 auto; }
.section-tag { font-size:12px; font-weight:700; color:#3B82F6; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; text-align:center; }
.section-title { font-size:clamp(24px,4vw,36px); font-weight:900; text-align:center; margin-bottom:36px; line-height:1.2; }

.steps { display:flex; flex-direction:column; gap:16px; }
.step { display:flex; gap:16px; align-items:flex-start; background:#1E293B; border:1px solid #334155; border-radius:16px; padding:20px; }
.step-icon { font-size:32px; flex-shrink:0; }
.step-content {}
.step-title { font-size:17px; font-weight:700; color:#F1F5F9; margin-bottom:4px; }
.step-desc { font-size:14px; color:#94A3B8; line-height:1.5; }

/* GANHOS */
.ganhos { background:#1E293B; border:1px solid #334155; border-radius:20px; padding:32px; margin:0 24px; max-width:700px; margin-left:auto; margin-right:auto; }
.ganhos-title { font-size:22px; font-weight:900; margin-bottom:20px; text-align:center; }
.ganhos-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
.ganha-card { background:#0B1120; border-radius:14px; padding:16px; text-align:center; }
.ganha-num { font-size:28px; font-weight:900; color:#3B82F6; }
.ganha-label { font-size:12px; color:#64748B; margin-top:4px; }
.ganhos-note { font-size:13px; color:#64748B; text-align:center; line-height:1.5; }

/* POR QUE AUTOMOTIVO */
.segs { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.seg { background:#1E293B; border:1px solid #334155; border-radius:14px; padding:20px; }
.seg-icon { font-size:28px; margin-bottom:10px; }
.seg-name { font-size:15px; font-weight:700; color:#F1F5F9; margin-bottom:4px; }
.seg-desc { font-size:13px; color:#64748B; line-height:1.4; }

/* PROVA SOCIAL */
.prova { background:linear-gradient(135deg,#1e3a5f22,#1e1b4b22); border:1px solid #3B82F633; border-radius:20px; padding:28px; max-width:700px; margin:0 auto 48px; }
.prova-quote { font-size:16px; color:#CBD5E1; line-height:1.7; font-style:italic; margin-bottom:16px; }
.prova-author { display:flex; align-items:center; gap:12px; }
.prova-avatar { width:44px; height:44px; background:linear-gradient(135deg,#3B82F6,#6366F1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:white; flex-shrink:0; }
.prova-name { font-size:14px; font-weight:700; color:#F1F5F9; }
.prova-place { font-size:12px; color:#64748B; }
.online-dot { display:inline-block; width:8px; height:8px; background:#10B981; border-radius:50%; margin-right:4px; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* PLANOS */
.planos { display:flex; flex-direction:column; gap:12px; }
.plano { background:#1E293B; border:2px solid #334155; border-radius:16px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; text-decoration:none; transition:all .2s; }
.plano:hover { border-color:#3B82F6; }
.plano.destaque { border-color:#3B82F6; background:#1e3a5f; }
.plano-info {}
.plano-nome { font-size:16px; font-weight:700; color:#F1F5F9; margin-bottom:3px; }
.plano-desc { font-size:13px; color:#64748B; }
.plano-preco { text-align:right; }
.plano-valor { font-size:24px; font-weight:900; color:#3B82F6; }
.plano-periodo { font-size:11px; color:#64748B; }
.plano-badge { background:#3B82F6; color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-bottom:6px; display:inline-block; }

/* FAQ */
.faq { display:flex; flex-direction:column; gap:10px; }
.faq-item { background:#1E293B; border:1px solid #334155; border-radius:12px; overflow:hidden; }
.faq-q { padding:16px 20px; font-size:15px; font-weight:600; color:#F1F5F9; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
.faq-q span { color:#64748B; font-size:18px; transition:transform .2s; }
.faq-q.open span { transform:rotate(45deg); }
.faq-a { display:none; padding:0 20px 16px; font-size:14px; color:#94A3B8; line-height:1.6; }
.faq-a.show { display:block; }

/* CTA FINAL */
.cta-final { background:linear-gradient(135deg,#1e3a5f,#1e1b4b); border:1px solid #3B82F644; border-radius:24px; padding:40px 28px; text-align:center; max-width:700px; margin:0 auto 48px; }
.cta-final h2 { font-size:clamp(24px,4vw,36px); font-weight:900; margin-bottom:12px; }
.cta-final p { font-size:15px; color:#94A3B8; margin-bottom:28px; line-height:1.6; }

/* FOOTER */
footer { border-top:1px solid #1E293B; padding:24px; text-align:center; font-size:12px; color:#475569; }

@media(max-width:480px){
  .ganhos-grid { grid-template-columns:1fr 1fr; }
  .segs { grid-template-columns:1fr 1fr; }
  .hero-btns { flex-direction:column; align-items:center; }
  .btn-main, .btn-sec { width:100%; text-align:center; }
}
</style>
</head>
<body>

<nav>
  <a href="/" class="logo">DOOH<span>PLAY</span></a>
  <a href="/cadastro" class="nav-cta">Começar grátis</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-tag">🚗 Feito para o setor automotivo</div>
  <h1>Enquanto o carro<br>está na revisão,<br><span>você já está ganhando</span></h1>
  <p>Seu cliente já espera enquanto o carro é atendido — na troca de óleo, no alinhamento, na revisão. Coloque uma TV, mostre seus serviços — e ainda ganhe dinheiro com anúncios enquanto ele aguarda.</p>
  <div class="hero-btns">
    <a href="/cadastro" class="btn-main">Quero ganhar dinheiro com minha TV 🚗</a>
    <a href="/pitch" class="btn-sec">Ver como funciona →</a>
  </div>
</div>

<!-- TV VISUAL -->
<div class="tv-section">
  <div class="tv-wrap">
    <div class="money-badge">+R$350*<br>/mês</div>
    <div class="tv-frame">
      <div class="tv-screen">
        <div class="tv-badge">● AO VIVO</div>
        <div class="tv-content">
          <div class="promo">🚗 Revisão Completa</div>
          <div class="sub">Troca de óleo + filtro por R$ 180</div>
        </div>
        <div class="tv-ad">
          <div class="tv-ad-text">📍 Anúncio patrocinado · Seguro Auto</div>
          <div class="tv-ad-logo">SegurAuto</div>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-top:8px">
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
    <div style="text-align:center;font-size:11px;color:#64748B;margin-top:10px">*Estimativa de exemplo — valor real varia por local e demanda de anunciantes</div>
  </div>
</div>

<!-- COMO FUNCIONA -->
<div class="section">
  <div class="section-tag">Como funciona</div>
  <div class="section-title">Simples assim —<br>3 passos</div>
  <div class="steps">
    <div class="step">
      <div class="step-icon">📲</div>
      <div class="step-content">
        <div class="step-title">1. Instalamos um app na sua TV</div>
        <div class="step-desc">Leva 15 minutos, sem atrapalhar o atendimento na recepção. Funciona em qualquer TV com Android ou Fire Stick.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-icon">🔧</div>
      <div class="step-content">
        <div class="step-title">2. Você mostra seus serviços e promoções</div>
        <div class="step-desc">Pelo celular, envia promoção de revisão, pacote de pneus, serviço novo disponível. Aparece na TV na hora, igual mandar foto no WhatsApp.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-icon">💰</div>
      <div class="step-content">
        <div class="step-title">3. Anunciantes pagam pra aparecer na sua tela</div>
        <div class="step-desc">Seguradoras, autopeças, financeiras — eles pagam pra aparecer pra quem está esperando o carro. Você recebe todo mês, automaticamente.</div>
      </div>
    </div>
  </div>
</div>

<!-- GANHOS -->
<div class="section" style="padding-top:0">
  <div class="ganhos">
    <div class="ganhos-title">💸 Quanto você pode ganhar?</div>
    <div class="ganhos-grid">
      <div class="ganha-card"><div class="ganha-num">700</div><div class="ganha-label">exibições por dia</div></div>
      <div class="ganha-card"><div class="ganha-num">R$350</div><div class="ganha-label">receita média/mês</div></div>
      <div class="ganha-card"><div class="ganha-num">0</div><div class="ganha-label">trabalho extra</div></div>
      <div class="ganha-card"><div class="ganha-num">15min</div><div class="ganha-label">para instalar</div></div>
    </div>
    <div class="ganhos-note">Valores baseados em estabelecimentos com movimento de segunda a sábado, TV ligada durante o horário de funcionamento. Tempo de espera em serviço automotivo costuma ser mais longo — mais minutos de tela por cliente.</div>
  </div>
</div>

<!-- POR QUE AUTOMOTIVO -->
<div class="section">
  <div class="section-tag">Por que setor automotivo</div>
  <div class="section-title">Seu cliente já fica parado<br>esperando o carro</div>
  <div class="segs">
    <div class="seg"><div class="seg-icon">⏱️</div><div class="seg-name">Tempo de espera longo</div><div class="seg-desc">Revisão, alinhamento e troca de óleo levam tempo — atenção garantida pra tela</div></div>
    <div class="seg"><div class="seg-icon">🛡️</div><div class="seg-name">Combina com seguro e financiamento</div><div class="seg-desc">Dono de carro é o público exato de seguradora e financeira</div></div>
    <div class="seg"><div class="seg-icon">🔁</div><div class="seg-name">Retorno programado</div><div class="seg-desc">Revisão periódica traz o mesmo cliente de volta a cada alguns meses</div></div>
    <div class="seg"><div class="seg-icon">📺</div><div class="seg-name">Já tem TV? Já começa a ganhar</div><div class="seg-desc">Se já tem uma TV na recepção, não precisa comprar nada pra começar</div></div>
  </div>
</div>

<!-- PROVA SOCIAL -->
<div class="section" style="padding-top:0">
  <div class="prova">
    <div class="prova-quote">"A tecnologia por trás do DOOHPLAY já está rodando ao vivo hoje — instalação, conteúdo e anúncios funcionando de ponta a ponta. Automotivo é um segmento novo pra gente, mas o produto que você vai receber é o mesmo, testado todo dia."</div>
    <div class="prova-author">
      <div class="prova-avatar">D</div>
      <div>
        <div class="prova-name">Equipe DOOHPLAY</div>
        <div class="prova-place"><span class="online-dot"></span>Piloto real rodando desde junho/2026</div>
      </div>
    </div>
  </div>
</div>

<!-- PLANOS -->
<div class="section">
  <div class="section-tag">Investimento</div>
  <div class="section-title">Começa com<br>7 dias grátis</div>
  <div class="planos">
    <a href="/cadastro?plano=starter" class="plano destaque" style="text-decoration:none">
      <div class="plano-info">
        <div class="plano-badge">Mais popular</div>
        <div class="plano-nome">Starter</div>
        <div class="plano-desc">1 TV · Dashboard · Suporte WhatsApp</div>
      </div>
      <div class="plano-preco">
        <div class="plano-valor">R$97</div>
        <div class="plano-periodo">/mês</div>
      </div>
    </a>
    <a href="/cadastro?plano=pro" class="plano" style="text-decoration:none">
      <div class="plano-info">
        <div class="plano-nome">Pro</div>
        <div class="plano-desc">3 TVs · Relatórios · Prioridade no suporte</div>
      </div>
      <div class="plano-preco">
        <div class="plano-valor">R$290</div>
        <div class="plano-periodo">/mês</div>
      </div>
    </a>
    <a href="/cadastro?plano=business" class="plano" style="text-decoration:none">
      <div class="plano-info">
        <div class="plano-nome">Business</div>
        <div class="plano-desc">Até 5 TVs · Suporte dedicado</div>
      </div>
      <div class="plano-preco">
        <div class="plano-valor">R$620</div>
        <div class="plano-periodo">/mês</div>
      </div>
    </a>
  </div>
  <div style="text-align:center;margin-top:16px;font-size:13px;color:#475569">
    Cancele quando quiser · Sem fidelidade · Sem multa
  </div>
</div>

<!-- FAQ -->
<div class="section">
  <div class="section-tag">Dúvidas</div>
  <div class="section-title">Perguntas frequentes</div>
  <div class="faq">
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">Preciso trocar minha TV? <span>+</span></div>
      <div class="faq-a">Não! O DOOHPLAY funciona em qualquer TV com Android ou Fire TV Stick. Se não tiver Android, vendemos um dispositivo por R$ 150 que conecta em qualquer TV.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">Serve pra oficina, concessionária e lava-rápido? <span>+</span></div>
      <div class="faq-a">Sim, qualquer estabelecimento do setor automotivo com um espaço onde o cliente aguarda funciona bem — oficina, concessionária, lava-rápido, borracharia.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">Como eu recebo o dinheiro dos anúncios? <span>+</span></div>
      <div class="faq-a">O pagamento é feito mensalmente via PIX ou transferência bancária. Você acompanha tudo em tempo real no seu dashboard.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">Posso cancelar quando quiser? <span>+</span></div>
      <div class="faq-a">Sim! Sem fidelidade, sem multa. Você cancela quando quiser pelo dashboard ou pelo WhatsApp de suporte.</div>
    </div>
  </div>
</div>

<!-- CTA FINAL -->
<div style="padding:0 24px">
  <div class="cta-final">
    <h2>Comece hoje.<br>É grátis por 7 dias.</h2>
    <p>Sem cartão de crédito. Sem burocracia.<br>Instale, veja funcionando e decida depois.</p>
    <a href="/cadastro" class="btn-main" style="display:inline-block">Criar minha conta grátis →</a>
    <div style="margin-top:16px;font-size:12px;color:#475569">Dúvidas? WhatsApp: (11) 9 6205-0987</div>
  </div>
</div>

<footer>
  <div style="font-size:16px;font-weight:900;margin-bottom:8px;">DOOH<span style="color:#3B82F6">PLAY</span></div>
  <div>© 2026 DOOHPLAY · São Paulo, Brasil</div>
  <div style="margin-top:8px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
    <a href="/" style="color:#475569;text-decoration:none">Home</a>
    <a href="/planos" style="color:#475569;text-decoration:none">Planos</a>
    <a href="/cadastro" style="color:#475569;text-decoration:none">Cadastro</a>
    <a href="/guia-uso" style="color:#475569;text-decoration:none">Guia de uso</a>
  </div>
</footer>

<script>
function toggleFaq(el) {
  el.classList.toggle('open')
  var ans = el.nextElementSibling
  ans.classList.toggle('show')
}
</script>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  })
}
