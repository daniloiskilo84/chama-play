// Movimento da página (mesma base do site da Bravuno): carregamento, entrada do hero, rolagem suave (Lenis),
// tour "da composição ao palco" em carrossel e cursor de brasa.
// Sem as bibliotecas ou com "reduzir movimento" ligado, a página funciona estática.
(function () {
  const raiz = document.documentElement;
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temGsap = !!(window.gsap && window.ScrollTrigger);
  const loader = document.getElementById('loader');
  const nav = document.getElementById('nav');

  // ---------- carregamento → entrada do hero ----------
  const inicio = performance.now();
  function entrar() {
    const espera = Math.max(0, 1300 - (performance.now() - inicio));
    setTimeout(() => {
      if (!temGsap || reduzir) {
        loader && loader.remove();
        document.querySelectorAll('.hero-in').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
        return;
      }
      const tl = gsap.timeline();
      tl.to(loader, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut', onComplete: () => loader.remove() })
        .from('.hero-art', { opacity: 0, scale: 0.85, y: 40, duration: 1.6, ease: 'power3.out' }, '-=0.3')
        .from('.hero-floor', { opacity: 0, duration: 1.4, ease: 'power2.out' }, '<0.2')
        .to('.hero-in', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, '<0.3');
    }, espera);
  }
  if (document.readyState === 'complete') entrar(); else window.addEventListener('load', entrar);

  // ---------- navegação ganha fundo ao rolar ----------
  const marcarNav = () => nav.classList.toggle('rolou', window.scrollY > 40);
  window.addEventListener('scroll', marcarNav, { passive: true });
  marcarNav();

  // ---------- cursor: seta dourada + brasa (só com mouse) ----------
  // A seta (cursor nativo dourado, no CSS) solta fagulhas douradas que sobem, tremulam e se apagam em ~1 s. Parado, não solta nada.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    raiz.classList.add('cursor-on');
    const tela = document.querySelector('.embers');
    const ctx = tela.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX = 140;
    const fagulhas = [];

    function medir() {
      tela.width = innerWidth * dpr; tela.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    window.addEventListener('resize', medir);

    let x = -100, y = -100, ux = null, uy = null, rodando = false;
    window.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      if (ux !== null && !reduzir) {
        const dist = Math.hypot(x - ux, y - uy);
        const n = Math.min(4, Math.floor(dist / 9));
        for (let i = 0; i < n && fagulhas.length < MAX; i++) {
          fagulhas.push({
            x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.6 - (x - ux) * 0.02, vy: -0.6 - Math.random() * 1.2,
            r: 0.8 + Math.random() * 1.8, vida: 1, gasto: 0.012 + Math.random() * 0.02, fase: Math.random() * 6.28,
          });
        }
      }
      ux = x; uy = y;
      if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
    });
    document.addEventListener('mouseleave', () => { ux = null; });

    function quadro(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = fagulhas.length - 1; i >= 0; i--) {
        const f = fagulhas[i];
        f.vida -= f.gasto;
        if (f.vida <= 0) { fagulhas.splice(i, 1); continue; }
        f.vy -= 0.015;                                   // o calor puxa para cima
        f.x += f.vx + Math.sin(t / 180 + f.fase) * 0.35; // tremula
        f.y += f.vy;
        const a = f.vida, r = f.r * (0.5 + a * 0.5);
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 4);
        g.addColorStop(0, `rgba(255, 236, 150, ${a})`);
        g.addColorStop(0.3, `rgba(238, 190, 37, ${a * 0.6})`);
        g.addColorStop(1, 'rgba(155, 80, 10, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(f.x - r * 4, f.y - r * 4, r * 8, r * 8);
      }
      ctx.globalCompositeOperation = 'source-over';

      if (fagulhas.length) requestAnimationFrame(quadro);
      else rodando = false;
    }

  }

  // ---------- tour "da composição ao palco": carrossel ----------
  // Setas, abas, setas do teclado e deslizar no celular. Avança sozinho a cada 7 s enquanto está
  // na tela; para de vez assim que a pessoa mexe nele (e nunca roda com "reduzir movimento").
  (function () {
    const tour = document.querySelector('.tour');
    if (!tour) return;
    raiz.classList.add('tour-ativo');
    const capitulos = [...tour.querySelectorAll('.chapter')];
    const abas = [...tour.querySelectorAll('.tour-tabs button')];
    const agora = tour.querySelector('.tour-now');
    const anterior = tour.querySelector('.tour-prev');
    const proxima = tour.querySelector('.tour-next');
    const marca = tour.querySelector('.tour-mark');
    const halo = tour.querySelector('.tour-halo');
    const TEMPO = 7000;
    const total = capitulos.length;
    let atual = 0, timer = null, automatico = !reduzir, visivel = false;

    capitulos.forEach((c, i) => { c.id = 'etapa-' + (i + 1); c.setAttribute('role', 'tabpanel'); });
    abas.forEach((b, i) => b.setAttribute('aria-controls', 'etapa-' + (i + 1)));
    tour.style.setProperty('--tempo', TEMPO + 'ms');

    function ir(i) {
      i = (i + total) % total;
      capitulos.forEach((c, k) => {
        c.classList.toggle('is-active', k === i);
        c.classList.toggle('antes', k < i);
        c.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
      abas.forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      // reinicia a barra de tempo da aba ativa
      const barra = abas[i].querySelector('i'); barra.style.animation = 'none'; void barra.offsetWidth; barra.style.animation = '';
      agora.textContent = String(i + 1).padStart(2, '0');
      // a chama cresce e acende a cada etapa
      const p = i / (total - 1);
      marca.style.transform = `scale(${0.82 + p * 0.28})`;
      marca.style.filter = `drop-shadow(0 30px 60px rgba(0,0,0,.8)) drop-shadow(0 0 ${20 + p * 70}px rgba(238,204,37,${0.15 + p * 0.45})) brightness(${0.65 + p * 0.5})`;
      halo.style.opacity = 0.5 + p * 0.5; halo.style.transform = `scale(${0.85 + p * 0.3})`;
      atual = i;
      agendar();
    }
    function agendar() {
      clearTimeout(timer);
      tour.classList.toggle('auto', automatico && visivel);
      if (automatico && visivel) timer = setTimeout(() => ir(atual + 1), TEMPO);
    }
    function mexeu() { automatico = false; agendar(); }

    anterior.addEventListener('click', () => { mexeu(); ir(atual - 1); });
    proxima.addEventListener('click', () => { mexeu(); ir(atual + 1); });
    abas.forEach((b, i) => b.addEventListener('click', () => { mexeu(); ir(i); }));
    tour.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { mexeu(); ir(atual + 1); if (abas.includes(document.activeElement)) abas[atual].focus(); }
      if (e.key === 'ArrowLeft') { mexeu(); ir(atual - 1); if (abas.includes(document.activeElement)) abas[atual].focus(); }
    });
    // deslizar com o dedo (só gesto horizontal claro)
    let x0 = null, y0 = null;
    const lista = tour.querySelector('.chapters');
    lista.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lista.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { mexeu(); ir(atual + (dx < 0 ? 1 : -1)); }
      x0 = null;
    });
    // pausa enquanto o mouse está em cima; só avança sozinho quando a seção está na tela
    tour.addEventListener('mouseenter', () => { clearTimeout(timer); tour.classList.remove('auto'); });
    tour.addEventListener('mouseleave', agendar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visivel = e.isIntersecting; agendar(); }, { threshold: 0.5 }).observe(tour);
    }
    ir(0);
  })();

  if (!temGsap || reduzir) return;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- rolagem suave ----------
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      lenis.scrollTo(alvo, { offset: -10 });
    }));
  }

  // ---------- hero: a chama sobe devagar enquanto a página rola ----------
  gsap.to('.hero-art', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---------- títulos entram uma vez ----------
  gsap.utils.toArray('.section-title, .reach-number, .final-title').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
