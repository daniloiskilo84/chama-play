// Movimento da página (mesma base do site da Bravuno): carregamento, entrada do hero, rolagem suave (Lenis),
// tour "da composição ao palco" fixado na tela (GSAP ScrollTrigger) e cursor de brasa.
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

  // ---------- cursor: brasa (só com mouse) ----------
  // O cursor solta fagulhas douradas que sobem, tremulam e se apagam em ~1 s. Parado, não solta nada.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    raiz.classList.add('cursor-on');
    const ponto = document.querySelector('.cursor-dot');
    const anel = document.querySelector('.cursor-ring');
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

    let x = -100, y = -100, ux = null, uy = null, ax = x, ay = y, rodando = false;
    window.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      ponto.style.transform = `translate(${x}px, ${y}px)`;
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
      ax += (x - ax) * 0.2; ay += (y - ay) * 0.2;
      anel.style.transform = `translate(${ax}px, ${ay}px)`;

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

      const parado = Math.abs(x - ax) < 0.3 && Math.abs(y - ay) < 0.3;
      if (fagulhas.length || !parado) requestAnimationFrame(quadro);
      else rodando = false;
    }

    document.querySelectorAll('a, summary, .people li, .edition-list li').forEach((el) => {
      el.addEventListener('mouseenter', () => anel.classList.add('sobre'));
      el.addEventListener('mouseleave', () => anel.classList.remove('sobre'));
    });
  }

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

  // ---------- tour fixado: cada trecho da rolagem acende uma etapa ----------
  raiz.classList.add('tour-ativo');
  const capitulos = [...document.querySelectorAll('.chapter')];
  const agora = document.querySelector('.tour-now');
  const barra = document.querySelector('.tour-progress i');
  const marca = document.querySelector('.tour-mark');
  let atual = 0;
  ScrollTrigger.create({
    trigger: '.tour-stage',
    start: 'top top',
    end: () => '+=' + window.innerHeight * capitulos.length * 0.85,
    pin: true,
    scrub: true,
    onUpdate(st) {
      const p = st.progress;
      const i = Math.min(capitulos.length - 1, Math.floor(p * capitulos.length));
      if (i !== atual) {
        capitulos[atual].classList.remove('is-active');
        capitulos[i].classList.add('is-active');
        atual = i;
        agora.textContent = String(i + 1).padStart(2, '0');
      }
      barra.style.transform = `scaleX(${(i + 1) / capitulos.length})`;
      // a chama cresce e acende conforme a carreira avança
      gsap.set(marca, {
        scale: 0.8 + p * 0.3,
        filter: `drop-shadow(0 30px 60px rgba(0,0,0,.8)) drop-shadow(0 0 ${20 + p * 70}px rgba(238,204,37,${0.15 + p * 0.45})) brightness(${0.6 + p * 0.55})`,
      });
    },
  });

  // ---------- títulos entram uma vez ----------
  gsap.utils.toArray('.section-title, .reach-number, .final-title').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
