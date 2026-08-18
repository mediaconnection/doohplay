export const dynamic = "force-dynamic"

export function GET() {
  const html = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DOOHPLAY para Farmácias — Transforme a TV de espera em renda extra</title>
<meta name="description" content="Seu cliente já espera na fila do caixa ou da consulta com o farmacêutico. Coloque uma TV, mostre suas promoções e ainda ganhe dinheiro com anúncios de saúde e bem-estar.">
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

/* CANAL SAÚDE */
.canal-box { background:linear-gradient(135deg,#0f2f24,#0b1120); border:1px solid #16A34A44; border-radius:20px; padding:28px; max-width:700px; margin:0 auto 48px; }
.canal-tag { display:inline-block; background:#16A34A22; color:#4ADE80; border:1px solid #16A34A55; border-radius:20px; padding:5px 14px; font-size:12px; font-weight:700; margin-bottom:14px; }
.canal-title { font-size:20px; font-weight:900; margin-bottom:10px; }
.canal-desc { font-size:14px; color:#94A3B8; line-height:1.6; }

/* GANHOS */
.ganhos { background:#1E293B; border:1px solid #334155; border-radius:20px; padding:32px; margin:0 24px; max-width:700px; margin-left:auto; margin-right:auto; }
.ganhos-title { font-size:22px; font-weight:900; margin-bottom:20px; text-align:center; }
.ganhos-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
.ganha-card { background:#0B1120; border-radius:14px; padding:16px; text-align:center; }
.ganha-num { font-size:28px; font-weight:900; color:#3B82F6; }
.ganha-label { font-size:12px; color:#64748B; margin-top:4px; }
.ganhos-note { font-size:13px; color:#64748B; text-align:center; line-height:1.5; }

/* POR QUE FARMÁCIA */
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
  <div class="hero-tag">💊 Feito para farmácias</div>
  <h1>O tempo de espera<br>no caixa também<br><span>pode pagar as contas</span></h1>
  <p>Seu cliente já espera na fila do caixa ou aguardando o farmacêutico. Coloque uma TV, mostre suas promoções — e ainda ganhe dinheiro com anúncios de saúde e bem-estar enquanto ele espera.</p>
  <div class="hero-btns">
    <a href="/cadastro" class="btn-main">Quero ganhar dinheiro com minha TV 💊</a>
    <a href="/pitch" class="btn-sec">Ver como funciona →</a>
  </div>
</div>

<!-- TV VISUAL -->
<div class="tv-section">
  <div class="tv-wrap">
    <div class="money-badge">+R$400*<br>/mês</div>
    <div class="tv-frame">
      <div class="tv-screen">
        <div class="tv-badge">● AO VIVO</div>
        <div class="tv-content">
          <div class="promo">💊 Protetor Solar FPS 60</div>
          <div class="sub">20% OFF — Só esta semana</div>
        </div>
        <div class="tv-ad">
          <div class="tv-ad-text">📍 Anúncio patrocinado · Plano de Saúde</div>
          <div class="tv-ad-logo">SaúdePlus</div>
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
        <div class="step-desc">Leva 15 minutos, sem atrapalhar o atendimento no caixa. Funciona em qualquer TV com Android ou Fire Stick.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-icon">💊</div>
      <div class="step-content">
        <div class="step-title">2. Você mostra suas promoções do dia</div>
        <div class="step-desc">Pelo celular, envia oferta de medicamento isento, promoção de dermocosmético, campanha de vacina. Aparece na TV na hora, igual mandar foto no WhatsApp.</div>
      </div>
    </div>
    <div class="step">
      <div class="step-icon">💰</div>
      <div class="step-content">
        <div class="step-title">3. Anunciantes pagam pra aparecer na sua tela</div>
        <div class="step-desc">Planos de saúde, laboratórios, bancos — eles pagam pra aparecer pra quem está esperando na sua farmácia. Você recebe todo mês, automaticamente.</div>
      </div>
    </div>
  </div>
</div>

<!-- CANAL SAÚDE -->
<div class="section" style="padding-top:0">
  <div class="canal-box">
    <div class="canal-tag">✅ Exclusivo pra farmácia e clínica</div>
    <div class="canal-title">Sua tela já nasce com conteúdo de saúde pronto</div>
    <div class="canal-desc">Além das suas próprias promoções, sua tela recebe automaticamente o <strong>Canal Saúde</strong> — conteúdo institucional sobre hidratação, prevenção e check-up, pensado especificamente pra farmácia e clínica. Você não precisa produzir nada a mais pra sua tela já sair cheia de conteúdo relevante pro seu cliente.</div>
  </div>
</div>

<!-- GANHOS -->
<div class="section" style="padding-top:0">
  <div class="ganhos">
    <div class="ganhos-title">💸 Quanto você pode ganhar?</div>
    <div class="ganhos-grid">
      <div class="ganha-card"><div class="ganha-num">1.8K</div><div class="ganha-label">exibições por dia</div></div>
      <div class="ganha-card"><div class="ganha-num">R$400</div><div class="ganha-label">receita média/mês</div></div>
      <div class="ganha-card"><div class="ganha-num">0</div><div class="ganha-label">trabalho extra</div></div>
      <div class="ganha-card"><div class="ganha-num">15min</div><div class="ganha-label">para instalar</div></div>
    </div>
    <div class="ganhos-note">Valores baseados em estabelecimentos com movimento de segunda a sábado, TV ligada durante o horário de funcionamento. Farmácia costuma ter público premium e tempo de espera maior — por isso o valor médio de anúncio tende a ser mais alto que em outros segmentos.</div>
  </div>
</div>

<!-- POR QUE FARMÁCIA -->
<div class="section">
  <div class="section-tag">Por que farmácia</div>
  <div class="section-title">Sua farmácia tem exatamente<br>o público que anunciante quer</div>
  <div class="segs">
    <div class="seg"><div class="seg-icon">⏱️</div><div class="seg-name">Tempo de espera real</div><div class="seg-desc">Fila do caixa ou aguardando o farmacêutico — atenção total pra tela</div></div>
    <div class="seg"><div class="seg-icon">👥</div><div class="seg-name">Público premium</div><div class="seg-desc">Quem frequenta farmácia tem poder de compra que interessa a anunciantes de saúde</div></div>
    <div class="seg"><div class="seg-icon">🔁</div><div class="seg-name">Cliente recorrente</div><div class="seg-desc">Medicamento de uso contínuo traz o mesmo cliente todo mês</div></div>
    <div class="seg"><div class="seg-icon">🩺</div><div class="seg-name">Conteúdo já combina</div><div class="seg-desc">Anúncio de saúde e bem-estar não é intrusivo — é o que o cliente já espera ver ali</div></div>
  </div>
</div>

<!-- PROVA SOCIAL -->
<div class="section" style="padding-top:0">
  <div class="prova">
    <div class="prova-quote">"A tecnologia por trás do DOOHPLAY já está rodando ao vivo hoje — instalação, conteúdo e anúncios funcionando de ponta a ponta. Farmácia é um segmento novo pra gente, mas o produto que você vai receber é o mesmo, testado todo dia — e o Canal Saúde foi pensado justamente com farmácia e clínica em mente."</div>
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
      <div class="faq-q" onclick="toggleFaq(this)">Posso controlar quais anúncios aparecem? <span>+</span></div>
      <div class="faq-a">Sim. Você pode bloquear categorias inteiras (bebida alcoólica, apostas, conteúdo adulto/sensível, conteúdo político) direto no seu dashboard, e anúncio de farmácia concorrente já é bloqueado automaticamente.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">O que é o Canal Saúde? <span>+</span></div>
      <div class="faq-a">É conteúdo institucional pensado pra farmácia e clínica — dicas de prevenção, hidratação, check-up. Aparece automaticamente na sua tela, sem custo e sem trabalho extra, complementando suas próprias promoções.</div>
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
