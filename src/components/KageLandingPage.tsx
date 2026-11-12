import React, { useEffect, useRef, useState } from 'react';
import { initKage, KageContext } from '../kage/kageEngine';
import '../styles/kage.css';

export interface KageLandingPageProps {
  layoutHero?: 'a' | 'b';
  layoutStory?: 'a' | 'b';
  layoutGallery?: 'a' | 'b';
  layoutCurriculum?: 'a' | 'b';
  layoutClosing?: 'a' | 'b';
  layoutFooter?: 'a' | 'b';
  onNavigate?: (chapter: string) => void;
}

export const KageLandingPage: React.FC<KageLandingPageProps> = ({
  layoutHero = 'b',
  layoutStory = 'b',
  layoutGallery = 'b',
  layoutCurriculum = 'b',
  layoutClosing = 'b',
  layoutFooter = 'b',
  onNavigate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<KageContext | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const [loadLabel, setLoadLabel] = useState('Initializing edit pipeline');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSec, setActiveSec] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastHoverTimeRef = useRef<number>(0);

  // Initialize and unlock Web Audio Context safely
  const ensureAudioCtx = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch (err) {
      console.warn('AudioContext init error:', err);
      return null;
    }
  };

  const playSound = (type: 'hover' | 'click' | 'toggle' | 'woosh') => {
    if (!sfxEnabled) return;
    try {
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'hover') {
        const nowMs = Date.now();
        if (nowMs - lastHoverTimeRef.current < 65) return;
        lastHoverTimeRef.current = nowMs;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.055);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.07);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.07);
        osc2.stop(now + 0.07);
      } else if (type === 'toggle') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(520, now);
        osc1.frequency.setValueAtTime(820, now + 0.07);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1080, now + 0.07);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.18);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.18);
      }
    } catch (e) {
      console.debug('Audio FX error:', e);
    }
  };

  const handleToggleSfx = () => {
    const ctx = ensureAudioCtx();
    const nextState = !sfxEnabled;
    setSfxEnabled(nextState);

    if (nextState && ctx) {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(540, now);
      osc1.frequency.setValueAtTime(880, now + 0.07);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1160, now + 0.07);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.2);
    }
  };

  // Global Audio Delegation Listener
  useEffect(() => {
    if (!sfxEnabled) return;

    const handleGlobalOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a, button, [data-cursor], .card, .chip, .les, .price-card, .result-card, .roadmap-card, .faq-btn, .stat-pill, .arrowlink');
      if (target) {
        playSound('hover');
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a, button, [data-cursor], .card, .chip, .les, .price-card, .result-card, .roadmap-card, .faq-btn, .stat-pill, .arrowlink');
      if (target) {
        playSound('click');
      }
    };

    window.addEventListener('mouseover', handleGlobalOver, { passive: true });
    window.addEventListener('click', handleGlobalClick, { passive: true });

    return () => {
      window.removeEventListener('mouseover', handleGlobalOver);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [sfxEnabled]);

  // Set body data-layout attributes
  useEffect(() => {
    document.body.setAttribute('data-layout-hero', layoutHero);
    document.body.setAttribute('data-layout-story', layoutStory);
    document.body.setAttribute('data-layout-gallery', layoutGallery);
    document.body.setAttribute('data-layout-curriculum', layoutCurriculum);
    document.body.setAttribute('data-layout-closing', layoutClosing);
    document.body.setAttribute('data-layout-footer', layoutFooter);
  }, [layoutHero, layoutStory, layoutGallery, layoutCurriculum, layoutClosing, layoutFooter]);

  // Initialize Three.js WebGL engine
  useEffect(() => {
    if (!canvasRef.current) return;
    let isCancelled = false;

    initKage(canvasRef.current, (pct, label) => {
      if (!isCancelled) {
        setLoadPct(pct);
        setLoadLabel(label);
      }
    }).then((ctx) => {
      if (isCancelled) {
        ctx.destroy();
        return;
      }
      engineRef.current = ctx;
      setLoading(false);
      setTimeout(() => {
        document.querySelectorAll('#hero [data-rv], #hero .mask-line').forEach((el, i) => {
          setTimeout(() => el.classList.add('rv-in'), 120 + i * 95);
        });
      }, 300);
    }).catch((err) => {
      console.warn('WebGL initialization fallback:', err);
      setLoading(false);
      document.documentElement.classList.add('no-webgl');
      document.body.classList.add('no-webgl');
      document.querySelectorAll('[data-rv], .mask-line').forEach((el) => el.classList.add('rv-in'));
    });

    return () => {
      isCancelled = true;
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  // Word-level reveal splitting & intersection observer for chapters
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('h1.display, h2.display').forEach((heading) => {
      const lines = heading.querySelectorAll<HTMLElement>('.mask-line');
      const targets = lines.length ? Array.from(lines) : [heading];
      targets.forEach((target) => {
        if (target.dataset.wordReady === 'true') return;
        const phrase = target.textContent?.replace(/\s+/g, ' ').trim();
        if (!phrase) return;
        target.dataset.wordReady = 'true';
        target.classList.add('word-reveal');
        target.setAttribute('aria-label', phrase);
        target.textContent = '';
        phrase.split(' ').forEach((word, i) => {
          if (i) target.appendChild(document.createTextNode(' '));
          const mask = document.createElement('span');
          const inner = document.createElement('span');
          mask.className = 'word-mask';
          mask.setAttribute('aria-hidden', 'true');
          inner.className = 'word';
          inner.textContent = word;
          inner.style.setProperty('--word-delay', `${i * 72}ms`);
          mask.appendChild(inner);
          target.appendChild(mask);
        });
      });
    });

    const items = document.querySelectorAll<HTMLElement>('[data-rv], .mask-line');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const d = parseFloat((e.target as HTMLElement).dataset.rvd || '0');
          setTimeout(() => e.target.classList.add('rv-in'), d);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.04 }
    );

    items.forEach((el) => {
      if (!el.closest('#hero')) io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  // Foreground layers lifecycle
  useEffect(() => {
    const pairs = Array.from(document.querySelectorAll<HTMLElement>('.sec .fg, .foot .fg')).map((stage) => ({
      section: stage.closest<HTMLElement>('.sec, .foot'),
      stage
    })).filter((p): p is { section: HTMLElement; stage: HTMLElement } => p.section !== null);

    if (!pairs.length) return;

    const sky = document.getElementById('fg-sky');
    const ratios = new Map<HTMLElement, number>();
    const homes = new WeakMap<HTMLElement, HTMLElement>();
    pairs.forEach((p) => homes.set(p.stage, p.section));
    let activeStage: HTMLElement | null = null;
    let retiringTimer: ReturnType<typeof setTimeout> | null = null;

    const lift = (stage: HTMLElement) => {
      if (!sky || stage.parentNode === sky) return;
      sky.appendChild(stage);
      void stage.offsetWidth;
    };

    const park = (stage: HTMLElement) => {
      const home = homes.get(stage);
      if (home && stage.parentNode !== home) {
        home.insertBefore(stage, home.firstChild);
      }
    };

    const retire = (stage: HTMLElement | null) => {
      if (!stage || stage === activeStage) return;
      stage.classList.remove('fg-active');
      stage.classList.add('fg-retiring');
      retiringTimer = setTimeout(() => {
        stage.classList.remove('fg-retiring');
        park(stage);
      }, 820);
    };

    const activate = (stage: HTMLElement) => {
      if (!stage || stage === activeStage) return;
      if (retiringTimer) clearTimeout(retiringTimer);
      stage.classList.remove('fg-retiring');
      lift(stage);
      stage.classList.add('fg-active');
      const prior = activeStage;
      activeStage = stage;
      retire(prior);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target as HTMLElement, e.isIntersecting ? e.intersectionRatio : 0));
        let bestPair = pairs[0];
        let bestRatio = ratios.get(bestPair.section) || 0;
        for (let i = 1; i < pairs.length; i++) {
          const r = ratios.get(pairs[i].section) || 0;
          if (r > bestRatio) {
            bestPair = pairs[i];
            bestRatio = r;
          }
        }
        if (bestRatio > 0) {
          activate(bestPair.stage);
        } else if (activeStage) {
          const prior = activeStage;
          activeStage = null;
          retire(prior);
        }
      },
      { rootMargin: '-12% 0px -12% 0px', threshold: [0, 0.12, 0.32, 0.55] }
    );

    pairs.forEach((p) => obs.observe(p.section));

    return () => {
      obs.disconnect();
      if (retiringTimer) clearTimeout(retiringTimer);
    };
  }, []);

  // Custom cursor movement
  useEffect(() => {
    const isCoarse = window.matchMedia('(hover: none)').matches;
    if (isCoarse || !cursorDotRef.current) return;

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    let anim = 0;

    const onPointerMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const cursorElements = document.querySelectorAll('[data-cursor]');
    const onEnter = () => {
      cursorDotRef.current?.classList.add('act');
      playSound('hover');
    };
    const onLeave = () => cursorDotRef.current?.classList.remove('act');
    const onClick = () => {
      playSound('click');
    };

    cursorElements.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('click', onClick);
    });

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(anim);
      cursorElements.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('click', onClick);
      });
    };
  }, [loading, sfxEnabled]);

  // Scroll listener for nav styling & section tracking
  useEffect(() => {
    let lastY = 0;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-cam]'));

    const handleScroll = () => {
      const y = window.scrollY;
      const vpH = window.innerHeight;
      setIsStuck(y > 40);
      setIsNavHidden(!menuOpen && y > lastY + 4 && y > vpH * 0.8);
      lastY = y;

      const totalDocHeight = document.documentElement.scrollHeight - vpH;
      if (totalDocHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (y / totalDocHeight) * 100)));
      }

      const mid = y + vpH * 0.4;
      let current = 0;
      sections.forEach((sec, idx) => {
        if (mid >= sec.offsetTop) current = idx;
      });
      setActiveSec(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  // Smooth scroll handler
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (targetId === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.querySelector(targetId);
      if (el) {
        const top = (el as HTMLElement).offsetTop - 40;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
    if (onNavigate) onNavigate(targetId);
  };

  const navNames = ['Vision', 'Studio', 'Showcase', 'Pipeline', 'Results', 'Pricing', 'FAQ', 'Collaborate', 'Agency'];

  const faqData = [
    {
      q: "What is your standard turnaround time for video edits?",
      a: "Our typical turnaround for YouTube long-form videos and vertical Shorts packs is 48 hours. For full-scale commercial brand films or documentary color grades, turnaround is usually 3-5 business days, with 24-hour rush delivery available for urgent uploads.",
      hi: "Standard YouTube aur Shorts edits 48 hours mein deliver ho jaate hain. Commercials ke liye 3-5 din lagte hain, aur emergency ke liye 24-hour express delivery option bhi available hai."
    },
    {
      q: "How do we transfer raw 4K/8K footage and project assets?",
      a: "We provide dedicated high-speed cloud workflows via Google Drive Enterprise, Dropbox, or Frame.io review links. You simply drop your raw camera takes, voiceovers, and brand guides into your private workspace folder.",
      hi: "Aap Google Drive, Dropbox ya Frame.io link se raw footage upload kar sakte hain. High-speed 4K/8K uploads seamlessly handle ho jaate hain."
    },
    {
      q: "Do you specialize in both Hindi and English content?",
      a: "Yes, absolutely. We work with both pure English global creators and top-tier Indian creators producing Hindi/Hinglish content. We understand regional comedic timing, meme culture, emotional cues, and sound effects specific to Indian audiences.",
      hi: "Haan bilkul! Hum pure English aur Hindi/Hinglish dono languages mein export karte hain. Indian creators ke pacing, memes aur emotional storytelling ko deeply samajhte hain."
    },
    {
      q: "What editing software and color grading pipelines do you use?",
      a: "We work inside DaVinci Resolve Studio 19, Adobe Premiere Pro, and After Effects. Color mastering is conducted in ACES 1.3 color space with calibrated OLED monitors, and audio is polished using iZotope RX & Dolby spatial plugins.",
      hi: "Industry-standard DaVinci Resolve 19, Premiere Pro aur After Effects use karte hain with cinema-grade ACES color grading and studio audio mastering."
    },
    {
      q: "What is your revision policy?",
      a: "We offer unlimited revisions on all our monthly creator and brand plans. Our goal is 100% client satisfaction and maximum viewer retention on every single upload.",
      hi: "Monthly plans mein unlimited revisions include hain jab tak aap final cut se 100% satisfy na ho jayein."
    },
    {
      q: "What payment methods are supported for Indian and International clients?",
      a: "For Indian creators and agencies, we accept UPI, NEFT, IMPS, Razorpay, and GST invoices. For international clients across the US, UK, and Dubai, we accept Stripe, Credit Cards, and Wise / Wire transfers in USD/GBP/EUR.",
      hi: "India ke liye UPI, NEFT/IMPS aur GST invoice available hai. International clients Stripe aur Bank Wire ke through USD mein pay kar sakte hain."
    }
  ];

  return (
    <>
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div id="vignette" />
      <div id="grain" />
      <div className="cur-dot" ref={cursorDotRef} id="cursor" />
      
      {/* Top Scroll Laser Progress Bar */}
      <div className="scroll-progress-line" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />

      {/* Preloader */}
      <div id="pre" className={loading ? '' : 'done'}>
        <div className="pre-in">
          <div className="pre-mark" style={{ width: '64px', height: '64px' }}>
            <img src="/logo.jpg" alt="The Alpha Edit Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
          <div className="pre-jp jp" style={{ letterSpacing: '0.35em', fontSize: '13px', fontWeight: 600 }}>
            THE ALPHA EDIT AGENCY
          </div>
          <div className="pre-bar">
            <i id="pre-fill" style={{ right: `${100 - loadPct}%`, background: 'linear-gradient(90deg, #e0231c, #ff5a3c)' }} />
          </div>
          <div className="pre-meta">
            <span>{loadLabel}</span>
            <b><span>{loadPct}</span>%</b>
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header className={`nav ${isStuck ? 'stuck' : ''} ${isNavHidden ? 'hide' : ''} ${menuOpen ? 'menu-open' : ''}`} id="nav">
        <a className="brand" href="#top" data-cursor onClick={(e) => handleScrollTo(e, '#top')}>
          <div className="brand-logo-wrap">
            <img
              src="/logo.jpg"
              alt="The Alpha Edit Agency Logo"
              className="brand-logo-img"
            />
          </div>
          <div className="brand-tx">
            <b>THE ALPHA EDIT</b>
            <span className="brand-sub">
              <span className="brand-status-dot" />
              <i>POST STUDIO</i>
            </span>
          </div>
        </a>

        <nav className="nav-links-wrap" id="nav-links">
          <div className="nav-pill-container">
            <a className={`nav-link ${activeSec === 0 ? 'on' : ''}`} href="#top" data-cursor onClick={(e) => handleScrollTo(e, '#top')}>
              <span>Studio</span>
            </a>
            <a className={`nav-link ${activeSec === 1 || activeSec === 2 ? 'on' : ''}`} href="#pathways" data-cursor onClick={(e) => handleScrollTo(e, '#pathways')}>
              <span>Showcase</span>
            </a>
            <a className={`nav-link ${activeSec === 3 ? 'on' : ''}`} href="#lessons" data-cursor onClick={(e) => handleScrollTo(e, '#lessons')}>
              <span>Pipeline</span>
            </a>
            <a className={`nav-link ${activeSec === 4 ? 'on' : ''}`} href="#results" data-cursor onClick={(e) => handleScrollTo(e, '#results')}>
              <span>Results</span>
            </a>
            <a className={`nav-link ${activeSec === 5 ? 'on' : ''}`} href="#pricing" data-cursor onClick={(e) => handleScrollTo(e, '#pricing')}>
              <span>Pricing</span>
            </a>
            <a className={`nav-link ${activeSec === 6 ? 'on' : ''}`} href="#faq" data-cursor onClick={(e) => handleScrollTo(e, '#faq')}>
              <span>FAQ</span>
            </a>
          </div>

          <div className="nav-mobile-footer">
            <a
              className="nav-mobile-cta"
              href="https://wa.me/919217540120?text=Hi%20The%20Alpha%20Edit%2C%20I%20want%20to%20discuss%20a%20video%20editing%20project."
              target="_blank"
              rel="noopener noreferrer"
              data-cursor
            >
              <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              <span>Book An Edit</span>
            </a>
          </div>
        </nav>

        <div className="nav-right-actions">
          <button
            className={`sfx-toggle-btn ${sfxEnabled ? 'active' : ''}`}
            onClick={handleToggleSfx}
            title={sfxEnabled ? 'Sound FX Enabled (Click to Mute)' : 'Enable Interactive Sound FX'}
            aria-label="Toggle Sound Effects"
            data-cursor
          >
            <span className="sfx-bars">
              <i />
              <i />
              <i />
            </span>
            <span className="sfx-btn-text">{sfxEnabled ? 'SFX ON' : 'SFX'}</span>
          </button>

          <a
            className="nav-cta-btn"
            href="https://wa.me/919217540120?text=Hi%20The%20Alpha%20Edit%2C%20I%20want%20to%20discuss%20a%20video%20editing%20project."
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
          >
            <span className="nav-cta-dot" />
            <span>Book an Edit</span>
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M3 11 11 3M5 3h6v6" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </a>

          <button
            className={`nav-burger ${menuOpen ? 'active' : ''}`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            data-cursor
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i /><i />
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <div className="page" id="top">
        {/* Chapter 00: Hero */}
        <section className="hero" id="hero" data-cam="0">
          <div className="hero-top">
            <div className="eyebrow" data-rv="fade">
              <span className="dot" /> [ 00 ] — Post-Production Reimagined · Founded by Alok Verma
            </div>
            <h1 className="display h-hero">
              <span className="mask-line"><span>Where raw vision</span></span>
              <span className="mask-line"><span>becomes cinematic</span></span>
              <span className="mask-line"><span>reality.</span></span>
            </h1>
            <p className="hero-sub body" data-rv="up">
              High-impact video editing, precision pacing, Hollywood color grading, and immersive soundscapes crafted for world-class creators, brands, and agencies.
            </p>
          </div>

          <div className="hero-spacer" />

          <div className="hero-foot">
            <div className="hero-cue" data-rv="fade">
              <span>Scroll to explore</span>
              <span className="track"><i /></span>
            </div>
            <div className="chapters" id="chips">
              <div className="chip stagger-1" data-chip="0" data-rv="up" data-cursor onClick={() => engineRef.current?.scrollToSection(1)}>
                <span className="num">01</span>
                <span className="tx">
                  <b>Story Pacing</b>
                  <p>Precision rhythm engineered for maximum viewer retention.</p>
                </span>
              </div>
              <div className="chip stagger-2" data-chip="1" data-rv="up" data-cursor onClick={() => engineRef.current?.scrollToSection(2)}>
                <span className="num">02</span>
                <span className="tx">
                  <b>Visual Polish</b>
                  <p>ACES color science, DaVinci mastering, and 3D VFX.</p>
                </span>
              </div>
              <div className="chip stagger-3" data-chip="2" data-rv="up" data-cursor onClick={() => engineRef.current?.scrollToSection(4)}>
                <span className="num">03</span>
                <span className="tx">
                  <b>Client Proof</b>
                  <p>500M+ views generated for Indian & global creators.</p>
                </span>
              </div>
              <div className="chip stagger-4" data-chip="3" data-rv="up" data-cursor onClick={() => engineRef.current?.scrollToSection(5)}>
                <span className="num">04</span>
                <span className="tx">
                  <b>Clear Pricing</b>
                  <p>Dedicated monthly pipelines and fast 48h turnaround.</p>
                </span>
              </div>
            </div>
          </div>


          <div className="word-fb" aria-hidden="true">ALPHA</div>

          <div className="hero-side" data-rv="up">
            <span className="v jp" style={{ letterSpacing: '0.35em', fontWeight: 600 }}>AGENCY</span>
          </div>
        </section>

        {/* Chapter 01: Studio / The Philosophy */}
        <section className="sec" id="gate" data-cam="1">
          <div className="fg" data-fg="gate" aria-hidden="true">
            <span className="fg-el fg-wall" data-fg-in="left">
              <img src="/secret-pathways-assets/foreground/png/temple-wall.webp" alt="" width="1536" height="884" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-pine" data-fg-in="right">
              <img src="/secret-pathways-assets/foreground/png/pine-tree.webp" alt="" width="1024" height="1438" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-grass" data-fg-in="up">
              <img src="/secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
            </span>
          </div>

          <div className="sec-head" data-rv="fade">
            <span className="k"><b>01</b> — The Studio Pipeline</span>
            <span className="rule" />
            <span className="k jp">STUDIO</span>
          </div>

          <div className="gate-grid">
            <h2 className="display h-sec" data-rv="up">Precision pacing, relentless focus, zero wasted frames.</h2>
            <div className="gate-copy">
              <p className="lead" data-rv="up">
                The Alpha Edit begins where generic templates end: surgical cutting, narrative rhythm, and visual depth crafted to capture attention from the first second and never let go.
              </p>
              <p className="body" data-rv="up">
                From multi-million subscriber creators to international brand campaigns, we transform raw captures into magnetic visual journeys. Complete 4K/8K workflows, DaVinci Resolve color pipelines, and frame-accurate timing tailored to your audience.
              </p>
              <div className="founder-credit" data-rv="up">
                <span className="founder-label">FOUNDED & DIRECTED BY</span>
                <b className="founder-name">ALOK VERMA</b>
                <span className="founder-title">Lead Post-Production Director & Colorist</span>
              </div>
              <a className="arrowlink" href="#pathways" data-rv="fade" data-cursor onClick={(e) => handleScrollTo(e, '#pathways')}>
                <span>View our portfolio reels</span>
                <span className="ar">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" />
                  </svg>
                </span>
              </a>
            </div>
          </div>

          <div className="gate-stats" data-rv="up">
            <div className="stagger-1"><b>500M+</b><span>Views Generated</span></div>
            <div className="stagger-2"><b>48h</b><span>Fast Turnaround</span></div>
            <div className="stagger-3"><b>120+</b><span>Global Clients</span></div>
            <div className="stagger-4"><b>100%</b><span>Retention Driven</span></div>
          </div>
        </section>

        {/* Infinite Capabilities Marquee Ribbon */}
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-track">
            <div className="marquee-content">
              <span>✦ DAVINCI RESOLVE ACES 1.3</span>
              <span>✦ PREMIERE PRO 2026</span>
              <span>✦ AFTER EFFECTS 3D VFX</span>
              <span>✦ 4K PRORES 4444 MASTER</span>
              <span>✦ VIRAL HOOK RETENTION</span>
              <span>✦ SPATIAL SOUND DESIGN & FOLEY</span>
              <span>✦ KINETIC MOTION GRAPHICS</span>
              <span>✦ 500M+ VIEWS GENERATED</span>
              <span>✦ 48-HOUR PRIORITY SLA</span>
            </div>
            <div className="marquee-content" aria-hidden="true">
              <span>✦ DAVINCI RESOLVE ACES 1.3</span>
              <span>✦ PREMIERE PRO 2026</span>
              <span>✦ AFTER EFFECTS 3D VFX</span>
              <span>✦ 4K PRORES 4444 MASTER</span>
              <span>✦ VIRAL HOOK RETENTION</span>
              <span>✦ SPATIAL SOUND DESIGN & FOLEY</span>
              <span>✦ KINETIC MOTION GRAPHICS</span>
              <span>✦ 500M+ VIEWS GENERATED</span>
              <span>✦ 48-HOUR PRIORITY SLA</span>
            </div>
          </div>
        </div>

        {/* Chapter 02: Featured Showcase / Portfolio Vault */}
        <section className="sec" id="pathways" data-cam="2">
          <div className="sec-head" data-rv="fade">
            <span className="k"><b>02</b> — Portfolio Vault</span>
            <span className="rule" />
            <span className="k jp">SHOWCASE</span>
          </div>

          <div className="gate-grid" style={{ marginBottom: '36px' }}>
            <h2 className="display h-sec" data-rv="up">Selected Works. Master Cuts. Real Impact.</h2>
            <div className="gate-copy">
              <p className="lead" data-rv="up">
                From viral creator series to high-converting brand ads and cinematic documentaries, each project is sculpted with frame-accurate pacing, custom sound design, and Hollywood color grading.
              </p>
            </div>
          </div>

          <div className="cards" id="cards">
            {/* Card 1: Commercials & TVCs */}
            <a
              className="card stagger-1"
              data-rv="up"
              data-cursor
              href={`https://wa.me/919217540120?text=${encodeURIComponent('Hi The Alpha Edit, I want to see sample reels for Commercial & Brand Edits.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card-fr">
                <span className="card-tag">Commercial Ads</span>
                <div className="card-play-icon">
                  <svg viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <div className="card-content">
                <span className="card-metric">4K Broadcast · High ROAS</span>
                <h3>Commercials & TVCs</h3>
                <p>Direct-response video ads, high-converting product showcases, and broadcast-ready brand films.</p>
                <span className="card-link">
                  Request Samples
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
            </a>

            {/* Card 2: Viral Creator Series */}
            <a
              className="card stagger-2"
              data-rv="up"
              data-cursor
              href={`https://wa.me/919217540120?text=${encodeURIComponent('Hi The Alpha Edit, I want to see sample reels for YouTube & Viral Creator Edits.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card-fr">
                <span className="card-tag">YouTube & Shorts</span>
                <div className="card-play-icon">
                  <svg viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <div className="card-content">
                <span className="card-metric">500M+ Views · Max Retention</span>
                <h3>Viral Creator Series</h3>
                <p>Pacing-engineered YouTube long-form, dynamic 9:16 Shorts, hooks design, and soundscapes.</p>
                <span className="card-link">
                  Request Samples
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
            </a>

            {/* Card 3: Cinematic Documentaries */}
            <a
              className="card stagger-3"
              data-rv="up"
              data-cursor
              href={`https://wa.me/919217540120?text=${encodeURIComponent('Hi The Alpha Edit, I want to see sample reels for Cinematic Documentaries & Color Grading.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card-fr">
                <span className="card-tag">Cinema & Docu</span>
                <div className="card-play-icon">
                  <svg viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <div className="card-content">
                <span className="card-metric">ACES Color · Dolby Mix</span>
                <h3>Cinematic Documentaries</h3>
                <p>Episodic narratives, DaVinci ACES 1.3 color mastering, rich foley audio, and filmic rhythm.</p>
                <span className="card-link">
                  Request Samples
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Chapter 03: Capabilities & Pipeline */}
        <section className="sec" id="lessons" data-cam="3">
          <div className="fg" data-fg="lessons" aria-hidden="true">
            <span className="fg-el fg-wall fg-el--flip" data-fg-in="right">
              <img src="/secret-pathways-assets/foreground/png/temple-wall.webp" alt="" width="1536" height="884" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-stones" data-fg-in="up">
              <img src="/secret-pathways-assets/foreground/png/basalt-stones.webp" alt="" width="1536" height="996" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-grass" data-fg-in="up">
              <img src="/secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
            </span>
          </div>

          <div className="sec-head" data-rv="fade">
            <span className="k"><b>03</b> — Core Capabilities</span>
            <span className="rule" />
            <span className="k jp">PROCESS</span>
          </div>

          <div className="cur-head">
            <h2 className="display h-sec" data-rv="up">What We Do.</h2>
            <p className="body-lg" data-rv="up">
              A complete post-production suite designed to turn your raw footage into ready-to-publish masterpieces.
            </p>
          </div>

          <div className="cur" id="cur">
            <div className="les stagger-1" data-les="0" data-cursor>
              <span className="k">01</span>
              <h3>Video Editing & Pacing<em className="jp">PACING</em></h3>
              <p>Hook design, seamless cuts, and rhythm optimized for maximum watch time.</p>
              <span className="t">Editing</span>
              <i className="bar" />
            </div>
            <div className="les stagger-2" data-les="1" data-cursor>
              <span className="k">02</span>
              <h3>Color Grading<em className="jp">COLOR</em></h3>
              <p>Cinema-grade tones, skin-tone perfection, and stylized looks in DaVinci Resolve.</p>
              <span className="t">Color</span>
              <i className="bar" />
            </div>
            <div className="les stagger-3" data-les="2" data-cursor>
              <span className="k">03</span>
              <h3>Sound Design & Mixing<em className="jp">AUDIO</em></h3>
              <p>Layered foley, punchy sound effects, music balance, and crisp voice mastering.</p>
              <span className="t">Audio</span>
              <i className="bar" />
            </div>
            <div className="les stagger-4" data-les="3" data-cursor>
              <span className="k">04</span>
              <h3>Motion Graphics & VFX<em className="jp">MOTION</em></h3>
              <p>Kinetic text, smooth transitions, logo reveals, and custom visual effects.</p>
              <span className="t">VFX</span>
              <i className="bar" />
            </div>
            <div className="les stagger-5" data-les="4" data-cursor>
              <span className="k">05</span>
              <h3>Multi-Format Export<em className="jp">EXPORT</em></h3>
              <p>Ready-to-upload files for YouTube (16:9), Instagram/Shorts (9:16), and TV broadcast.</p>
              <span className="t">Delivery</span>
              <i className="bar" />
            </div>
          </div>

          {/* 4-Step Production Roadmap */}
          <div className="workflow-roadmap-section" data-rv="up">
            <div className="workflow-header">
              <div className="workflow-badge">
                <span className="workflow-dot" />
                <span>4-STEP PRODUCTION PROTOCOL</span>
              </div>
              <h3 className="workflow-title">How We Turn Your Raw Footage Into Viral Gold</h3>
              <p className="workflow-sub">A friction-free collaborative workflow engineered for effortless asset handoff and 48-hour delivery.</p>
            </div>

            <div className="roadmap-grid">
              {/* Step 1 */}
              <div className="roadmap-card stagger-1" data-cursor>
                <div className="roadmap-card-top">
                  <span className="step-num">01</span>
                  <div className="step-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
                <h4>1. Raw Footage Drop</h4>
                <p>Upload your multi-cam takes, voiceover files, and asset brief via your private Google Drive or Frame.io workspace.</p>
                <span className="step-pill">Instant Sync · Zero Effort</span>
              </div>

              {/* Step 2 */}
              <div className="roadmap-card stagger-2" data-cursor>
                <div className="roadmap-card-top">
                  <span className="step-num">02</span>
                  <div className="step-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                  </div>
                </div>
                <h4>2. Hook & Story Assembly</h4>
                <p>We craft high-retention opening hooks, remove dead air, and sculpt dynamic narrative pacing within 24 hours.</p>
                <span className="step-pill">Frame-Accurate Pacing</span>
              </div>

              {/* Step 3 */}
              <div className="roadmap-card stagger-3" data-cursor>
                <div className="roadmap-card-top">
                  <span className="step-num">03</span>
                  <div className="step-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <h4>3. VFX, Sound & ACES Grade</h4>
                <p>DaVinci Resolve ACES 1.3 color mastering, layered foley sound design, kinetic typography, and 3D VFX polish.</p>
                <span className="step-pill">Hollywood Master</span>
              </div>

              {/* Step 4 */}
              <div className="roadmap-card stagger-4" data-cursor>
                <div className="roadmap-card-top">
                  <span className="step-num">04</span>
                  <div className="step-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <h4>4. 4K Master & Revisions</h4>
                <p>Receive your 16:9 long-form master and 9:16 vertical cutdowns with rapid revision turnaround.</p>
                <span className="step-pill">48h SLA · 100% Guaranteed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 04: Indian & Global Client Results */}
        <section className="sec" id="results" data-cam="4">
          <div className="sec-head" data-rv="fade">
            <span className="k"><b>04</b> — Client Proof & Case Studies</span>
            <span className="rule" />
            <span className="k jp">RESULTS</span>
          </div>

          <div className="gate-grid">
            <h2 className="display h-sec" data-rv="up">Proven results across India, the US, and global stages.</h2>
            <div className="gate-copy">
              <p className="lead" data-rv="up">
                Real view spikes, viral retention curves, and high-converting ad reels. Here is what leading YouTubers, founders, and creators say about working with The Alpha Edit.
              </p>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card stagger-1" data-rv="up">
              <div className="result-header">
                <div className="client-meta">
                  <div className="client-avatar">AS</div>
                  <div className="client-info">
                    <h4>Aditya Sharma</h4>
                    <span>Finance & Tech (1.2M Subs, Mumbai)</span>
                  </div>
                </div>
                <span className="metric-badge">+280% Retention</span>
              </div>
              <div className="quote-box">
                <p className="quote-en">
                  "The visual pacing and hook design changed our entire channel trajectory. Average retention on our 15+ min breakdowns skyrocketed from 34% to over 59%."
                </p>
                <p className="quote-hi">
                  "Bhai pehle edit ke baad hi retention aur views double ho gaye! Storytelling aur sound design ka level bilkul alag hai. Best team in India."
                </p>
              </div>
              <div className="stat-pills">
                <span className="stat-pill">YouTube 4K</span>
                <span className="stat-pill">DaVinci ACES</span>
                <span className="stat-pill">Pacing Curve</span>
              </div>
            </div>

            <div className="result-card stagger-2" data-rv="up">
              <div className="result-header">
                <div className="client-meta">
                  <div className="client-avatar">KR</div>
                  <div className="client-info">
                    <h4>Kavya & Rohan</h4>
                    <span>D2C Brand Founders (Bengaluru)</span>
                  </div>
                </div>
                <span className="metric-badge">4.8x Meta ROAS</span>
              </div>
              <div className="quote-box">
                <p className="quote-en">
                  "Our direct-response video ads scaled to over ₹45L/month ad spend profitably. The Alpha Edit knows how to stop the scroll in under 2 seconds."
                </p>
                <p className="quote-hi">
                  "Hook testing aur 3D kinetic typography ne hamare Meta Ads ka conversion 3x boost kiya. Super reliable delivery timeline."
                </p>
              </div>
              <div className="stat-pills">
                <span className="stat-pill">E-Commerce TVC</span>
                <span className="stat-pill">Kinetic Motion</span>
                <span className="stat-pill">9:16 Shorts</span>
              </div>
            </div>

            <div className="result-card stagger-3" data-rv="up">
              <div className="result-header">
                <div className="client-meta">
                  <div className="client-avatar">VR</div>
                  <div className="client-info">
                    <h4>Vikram Rathore</h4>
                    <span>Cinematic & Travel Creator (Delhi)</span>
                  </div>
                </div>
                <span className="metric-badge">8.5M Viral Views</span>
              </div>
              <div className="quote-box">
                <p className="quote-en">
                  "Their ACES color science and layered 3D foley audio gave our travel documentary an authentic Netflix-screen aesthetic."
                </p>
                <p className="quote-hi">
                  "Har ek cut frame-accurate hai. 48 hours delivery time is crazy fast when you consider the high-ticket grading quality."
                </p>
              </div>
              <div className="stat-pills">
                <span className="stat-pill">Documentary</span>
                <span className="stat-pill">Dolby Audio</span>
                <span className="stat-pill">Color Grading</span>
              </div>
            </div>

            <div className="result-card stagger-4" data-rv="up">
              <div className="result-header">
                <div className="client-meta">
                  <div className="client-avatar">TS</div>
                  <div className="client-info">
                    <h4>TechSphere Network</h4>
                    <span>Podcast Network (Gurgaon / Dubai)</span>
                  </div>
                </div>
                <span className="metric-badge">60+ Edits / Mo</span>
              </div>
              <div className="quote-box">
                <p className="quote-en">
                  "Managing 4 multi-cam podcasts simultaneously used to be chaotic until we integrated The Alpha Edit's dedicated post pipeline."
                </p>
                <p className="quote-hi">
                  "Zero headache, zero delays. Pure team 24/7 dedicatedly execute karti hai. Truly the alpha standard in video post-production."
                </p>
              </div>
              <div className="stat-pills">
                <span className="stat-pill">Multi-Cam Suite</span>
                <span className="stat-pill">Shorts Engine</span>
                <span className="stat-pill">48h SLA</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 05: Pricing Tiers */}
        <section className="sec" id="pricing" data-cam="5">
          <div className="sec-head" data-rv="fade">
            <span className="k"><b>05</b> — Investment & Pricing</span>
            <span className="rule" />
            <span className="k jp">PRICING</span>
          </div>

          <div className="gate-grid">
            <h2 className="display h-sec" data-rv="up">Transparent tiers. Zero lock-in. Scale as you grow.</h2>
            <div className="gate-copy">
              <p className="lead" data-rv="up">
                Whether you need a high-frequency Shorts engine or Hollywood-grade documentary post-production, we offer dedicated monthly bandwidth.
              </p>
            </div>
          </div>

          <div className="pricing-controls" data-rv="fade">
            <div className="cur-toggle-wrap">
              <button
                className={`cur-toggle-btn ${currency === 'INR' ? 'active' : ''}`}
                onClick={() => setCurrency('INR')}
              >
                INR (₹ India)
              </button>
              <button
                className={`cur-toggle-btn ${currency === 'USD' ? 'active' : ''}`}
                onClick={() => setCurrency('USD')}
              >
                USD ($ Global)
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Tier 1 */}
            <div className="price-card stagger-1" data-rv="up">
              <div className="price-tier">Short-Form Engine</div>
              <h3 className="price-name">Creator Sprint</h3>
              <p className="price-desc">Engineered for viral TikTok, Instagram Reels, and YouTube Shorts scaling.</p>
              <div className="price-amount">
                <span className="price-val">{currency === 'INR' ? '₹5,999' : '$99'}</span>
                <span className="price-period">/ month</span>
              </div>
              <ul className="price-features">
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  15 High-Retention Vertical Edits (9:16)
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Kinetic Typography & B-roll sourcing
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Custom SFX & trending audio mix
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  48-hour delivery turnaround
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Unlimited revisions & Slack access
                </li>
              </ul>
              <a
                className="price-btn"
                href={`https://wa.me/919217540120?text=${encodeURIComponent(`Hi The Alpha Edit, I want to get started with the Creator Sprint Plan (${currency === 'INR' ? '₹5,999' : '$99'}/mo).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
              >
                Get Started on WhatsApp
              </a>
            </div>

            {/* Tier 2 */}
            <div className="price-card featured stagger-2" data-rv="up">
              <div className="price-tier">Flagship Post Pipeline</div>
              <h3 className="price-name">Cinematic YouTube</h3>
              <p className="price-desc">Full-service long-form YouTube mastery, DaVinci grading, and viral hooks.</p>
              <div className="price-amount">
                <span className="price-val">{currency === 'INR' ? '₹11,999' : '$199'}</span>
                <span className="price-period">/ month</span>
              </div>
              <ul className="price-features">
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  4 Long-Form YouTube Masters (10-25 mins)
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  8 Viral Cutdowns / Shorts for Repurposing
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  DaVinci Resolve ACES Color Grading
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  3D Spatial Sound Design & Vocal Master
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Custom Thumbnail concepts & A/B Hooks
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Dedicated Senior Editor & Priority Queue
                </li>
              </ul>
              <a
                className="price-btn"
                href={`https://wa.me/919217540120?text=${encodeURIComponent(`Hi The Alpha Edit, I want to claim a slot for the Cinematic YouTube Plan (${currency === 'INR' ? '₹11,999' : '$199'}/mo).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
              >
                Claim Your Slot on WhatsApp
              </a>
            </div>

            {/* Tier 3 */}
            <div className="price-card stagger-3" data-rv="up">
              <div className="price-tier">Agency & Enterprise</div>
              <h3 className="price-name">Brand Pipeline</h3>
              <p className="price-desc">Custom production pipeline for high-growth D2C brands, TVCs, and studios.</p>
              <div className="price-amount">
                <span className="price-val">{currency === 'INR' ? '₹19,999' : '$299'}</span>
                <span className="price-period">/ month</span>
              </div>
              <ul className="price-features">
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Commercials, Ad Creatives & Brand Films
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  4K/8K Broadcast ProRes 4444 Master exports
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Custom 3D VFX & Motion Graphics Suite
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  24-Hour Priority Rush Turnaround
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Dedicated Art Director + Team of 3 Editors
                </li>
                <li>
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 4.5 6.5 11.5 2.5 7.5l1-1 3 3 6-6z"/></svg>
                  Custom Enterprise SLA & NDA Protection
                </li>
              </ul>
              <a
                className="price-btn"
                href={`https://wa.me/919217540120?text=${encodeURIComponent(`Hi The Alpha Edit, I want to discuss the Brand Pipeline Plan (${currency === 'INR' ? '₹19,999' : '$299'}/mo) for my company.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Chapter 06: FAQ Section */}
        <section className="sec" id="faq" data-cam="6">
          <div className="sec-head" data-rv="fade">
            <span className="k"><b>06</b> — Frequently Asked Questions</span>
            <span className="rule" />
            <span className="k jp">FAQ</span>
          </div>

          <div className="gate-grid">
            <h2 className="display h-sec" data-rv="up">Everything you need to know before starting.</h2>
            <div className="gate-copy">
              <p className="lead" data-rv="up">
                Clear answers on timelines, revisions, raw footage pipelines, Hindi/English localization, and billing.
              </p>
            </div>
          </div>

          <div className="faq-wrap" data-rv="up">
            {faqData.map((item, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
                <button
                  className="faq-btn"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                >
                  <h3 className="faq-q">{item.q}</h3>
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-ans">
                  <p className="faq-ans-text">{item.a}</p>
                  <p className="faq-ans-hi">{item.hi}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chapter 07: Collaborate / Call To Action */}
        <section className="sec fin" id="eternity" data-cam="7">
          <div className="fg" data-fg="eternity" aria-hidden="true">
            <span className="fg-el fg-hill" data-fg-in="up">
              <img src="/secret-pathways-assets/foreground/png/hill.webp" alt="" width="1774" height="887" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-ruins" data-fg-in="left">
              <img src="/secret-pathways-assets/foreground/png/shrine-ruins.webp" alt="" width="1536" height="1001" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-grass" data-fg-in="up">
              <img src="/secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
            </span>
            <span className="fg-el fg-sakura" data-fg-in="left">
              <img src="/secret-pathways-assets/foreground/png/sakura-branch.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" />
            </span>
          </div>

          <div className="eyebrow" data-rv="fade">[ 07 ] — Collaborate</div>
          <h2 className="display" data-rv="up">Scale Your Videos.</h2>
          <p className="body-lg" data-rv="up" style={{ maxWidth: '36ch', margin: '16px auto 0' }}>
            Cinema-grade post-production & viral retention pacing. Instant onboarding.
          </p>
          <a
            className="cta-whatsapp"
            href="https://wa.me/919217540120?text=Hi%20Alok%20%26%20The%20Alpha%20Edit%20team%2C%20I%20want%20to%20book%20a%20video%20editing%20pipeline%20for%20my%20channel%2Fbrand."
            target="_blank"
            rel="noopener noreferrer"
            data-rv="fade"
            data-cursor
          >
            <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            <span>Chat on WhatsApp</span>
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
              <path d="M3 11 11 3M5 3h6v6" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </a>
          <div className="cta-status-pill" data-rv="fade">
            <span className="cta-status-dot" />
            <span>Alok Verma & Team · Instant Response</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="foot" data-cam="8">
          {/* Pre-Footer Action Banner */}
          <div className="foot-pre-banner" data-rv="up">
            <div className="foot-pre-content">
              <div className="foot-status-tag">
                <span className="foot-live-dot" />
                <span>Q4 2026 PRODUCTION INTAKE ACTIVE</span>
              </div>
              <h2>Ready to scale your content to millions?</h2>
              <p>Partner with Director Alok Verma. Cinema-grade post-production engineered for conversion and retention.</p>
            </div>
            <div className="foot-pre-actions">
              <a
                className="foot-pre-btn primary"
                href="https://wa.me/919217540120"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
              >
                <svg viewBox="0 0 24 24" className="foot-btn-icon"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>Book On WhatsApp</span>
                <svg viewBox="0 0 14 14" fill="none" className="foot-arrow-svg">
                  <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
              <a
                className="foot-pre-btn secondary"
                href="mailto:thealphaedit101@gmail.com"
                data-cursor
              >
                <span>Official Email</span>
              </a>
            </div>
          </div>

          <div className="foot-grid">
            {/* Brand Column */}
            <div className="foot-brand">
              <div className="foot-logo-row">
                <img
                  src="/logo.jpg"
                  alt="The Alpha Edit Agency Logo"
                  className="foot-logo-img"
                />
                <div className="foot-logo-text">
                  <h3>THE ALPHA EDIT</h3>
                  <span>POST-PRODUCTION & CINEMA SUITE</span>
                </div>
              </div>
              <p>
                An elite video post-production agency founded & directed by <strong>Alok Verma</strong>. We engineer high-converting commercial reels, YouTube retention pacing, and documentary narratives for ambitious brands and creators worldwide.
              </p>

              {/* Studio Operational Pulse */}
              <div className="foot-studio-pill">
                <span className="foot-pulse-dot" />
                <span>Noida Studio (IST) · Online · 24-48H Turnaround</span>
              </div>

              {/* Social Pills */}
              <div className="foot-socials">
                <a
                  className="foot-social-link wa"
                  href="https://wa.me/919217540120"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                  title="WhatsApp Consultation"
                >
                  <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  <span>WhatsApp</span>
                </a>
                <a
                  className="foot-social-link ig"
                  href="https://www.instagram.com/thealphaedit.in?igsh=MWF5N3puMThuenk2eg%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                  title="Instagram Reel Vault"
                >
                  <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  <span>Instagram</span>
                </a>
                <a
                  className="foot-social-link li"
                  href="https://www.linkedin.com/company/thealphaedit/?viewAsMember=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                  title="LinkedIn Network"
                >
                  <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  <span>LinkedIn</span>
                </a>
                <a
                  className="foot-social-link mail"
                  href="mailto:thealphaedit101@gmail.com"
                  data-cursor
                  title="Send Direct Inquiry"
                >
                  <svg viewBox="0 0 24 24"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l9.518 7.713 9.518-7.713v11.817h-19.036z"/></svg>
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Direct Contact Column */}
            <div className="foot-col foot-contact-col">
              <h4>Direct Inquiries</h4>
              <div className="foot-contact-card">
                <div className="foot-contact-item">
                  <div className="foot-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <span className="foot-contact-label">Call / WhatsApp</span>
                    <a href="https://wa.me/919217540120" target="_blank" rel="noopener noreferrer" data-cursor>+91 9217540120</a>
                  </div>
                </div>

                <div className="foot-contact-item">
                  <div className="foot-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <span className="foot-contact-label">Official Email</span>
                    <a href="mailto:thealphaedit101@gmail.com" data-cursor>thealphaedit101@gmail.com</a>
                  </div>
                </div>

                <div className="foot-contact-item">
                  <div className="foot-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <span className="foot-contact-label">Studio Location</span>
                    <span>Noida, Uttar Pradesh, India</span>
                  </div>
                </div>

                <div className="foot-contact-item">
                  <div className="foot-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <div>
                    <span className="foot-contact-label">Collaboration</span>
                    <span>Global Remote · Frame.io & Slack</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Column */}
            <div className="foot-col">
              <h4>Capabilities</h4>
              <ul className="foot-nav-list">
                <li><a href="#gate" data-cursor onClick={(e) => handleScrollTo(e, '#gate')}><span>Commercial Ads & TVCs</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#pathways" data-cursor onClick={(e) => handleScrollTo(e, '#pathways')}><span>Viral Creator Retainers</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#lessons" data-cursor onClick={(e) => handleScrollTo(e, '#lessons')}><span>DaVinci ACES Color Grading</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#lessons" data-cursor onClick={(e) => handleScrollTo(e, '#lessons')}><span>Spatial Sound & Foley Mix</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#lessons" data-cursor onClick={(e) => handleScrollTo(e, '#lessons')}><span>Motion Graphics & 3D VFX</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
              </ul>
            </div>

            {/* Quick Links Column */}
            <div className="foot-col">
              <h4>Navigation</h4>
              <ul className="foot-nav-list">
                <li><a href="#top" data-cursor onClick={(e) => handleScrollTo(e, '#top')}><span>Studio Showreel</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#pathways" data-cursor onClick={(e) => handleScrollTo(e, '#pathways')}><span>Featured Work Vault</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#results" data-cursor onClick={(e) => handleScrollTo(e, '#results')}><span>Client Metrics & ROAS</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#pricing" data-cursor onClick={(e) => handleScrollTo(e, '#pricing')}><span>Retainer Pricing</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
                <li><a href="#faq" data-cursor onClick={(e) => handleScrollTo(e, '#faq')}><span>Agency FAQs</span><svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></a></li>
              </ul>
            </div>
          </div>

          {/* Studio Tech Stack & Certification Quality Badges */}
          <div className="foot-badges-row">
            <span className="foot-badges-label">POST-PRODUCTION SUITE:</span>
            <div className="foot-badge-pills">
              <span className="foot-badge">DaVinci Resolve Studio 19</span>
              <span className="foot-badge">Premiere Pro</span>
              <span className="foot-badge">After Effects</span>
              <span className="foot-badge">ACES 1.3 Color</span>
              <span className="foot-badge">Apple ProRes 4444</span>
              <span className="foot-badge">Dolby Foley Mix</span>
            </div>
          </div>

          <div className="foot-base">
            <div className="foot-base-left">
              <span>© 2026 THE ALPHA EDIT AGENCY. ALL RIGHTS RESERVED.</span>
              <span className="foot-base-dot">·</span>
              <span>DIRECTED BY <strong>ALOK VERMA</strong></span>
            </div>
            <button
              className="foot-back-top-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data-cursor
              aria-label="Back to top of page"
            >
              <span>Back to top</span>
              <svg viewBox="0 0 14 14" fill="none">
                <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </footer>
      </div>

      {/* Sky container for hoisted active chapter foreground layers */}
      <div id="fg-sky" aria-hidden="true" />

      {/* Progress Rail */}
      <div className="rail" id="rail">
        {navNames.map((name, i) => (
          <button
            key={i}
            className={activeSec === i ? 'on' : ''}
            title={name}
            aria-label={name}
            data-cursor
            onClick={() => engineRef.current?.scrollToSection(i)}
          >
            <i />
          </button>
        ))}
      </div>

      {/* Floating Sound FX Widget */}
      <button
        className={`floating-sfx-pill ${sfxEnabled ? 'active' : ''}`}
        onClick={handleToggleSfx}
        title={sfxEnabled ? 'Studio Sound FX Enabled (Click to Mute)' : 'Enable Interactive Studio Sound FX'}
        aria-label="Toggle Studio Sound Effects"
        data-cursor
      >
        <span className="sfx-bars">
          <i />
          <i />
          <i />
        </span>
        <span className="sfx-pill-label">{sfxEnabled ? 'SFX ON' : 'SFX OFF'}</span>
      </button>

      {/* Live WhatsApp Floating Chat Widget */}
      <aside className="floating-whatsapp-widget" aria-label="WhatsApp Contact Support">
        <a
          className="whatsapp-float-btn"
          href="https://wa.me/919217540120"
          target="_blank"
          rel="noopener noreferrer"
          data-cursor
          title="Direct WhatsApp Consultation with Director Alok"
        >
          <div className="whatsapp-float-icon-wrap">
            <svg viewBox="0 0 24 24" className="whatsapp-svg">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span className="whatsapp-radar-dot" />
          </div>
          <div className="whatsapp-float-info">
            <span className="whatsapp-float-title">Chat with Alok</span>
            <span className="whatsapp-float-sub">● Online · Direct Inquiries</span>
          </div>
        </a>
      </aside>
    </>
  );
};

export default KageLandingPage;
