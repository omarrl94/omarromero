import { useEffect, useRef } from 'react';
import { createScene } from '../scenes/index.js';
import { createGlitch } from '../scenes/glitch.js';
import { W, H } from '../scenes/common.js';
import { sourceFile } from '../core/transpiler.js';
import { play } from '../core/sound.js';

/**
 * Canvas en vivo: renderiza la escena de la misión con los datos que produce
 * el código del usuario y superpone el Bug Visualizer cuando hay un error.
 */
export default function LiveCanvas({ sceneName, data, error, lang, runId, onJumpLine }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const scene = useRef(null);
  const glitch = useRef(createGlitch());
  const view = useRef({ s: 1, ox: 0, oy: 0, dpr: 1 });
  const jumpRef = useRef(onJumpLine);
  jumpRef.current = onJumpLine;

  useEffect(() => {
    const sc = createScene(sceneName);
    scene.current = sc;
    if (sc && sc.mount) sc.mount();
    return () => {
      if (sc && sc.unmount) sc.unmount();
      scene.current = null;
    };
  }, [sceneName]);

  useEffect(() => {
    if (scene.current) scene.current.setData({ ...(data || {}) });
  }, [sceneName, runId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    glitch.current.set(error || null, sourceFile(lang));
    if (error) play('glitch');
  }, [error, lang, runId]);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext('2d');
    let raf = 0;
    let last = performance.now();
    const ro = new ResizeObserver(() => {
      const r = wrap.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.floor(r.width * dpr));
      cv.height = Math.max(1, Math.floor(r.height * dpr));
      cv.style.width = `${r.width}px`;
      cv.style.height = `${r.height}px`;
      const s = Math.min(r.width / W, r.height / H);
      view.current = { s, ox: (r.width - W * s) / 2, oy: (r.height - H * s) / 2, dpr };
    });
    ro.observe(wrap.current);
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { s, ox, oy, dpr } = view.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#070910';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(s * dpr, 0, 0, s * dpr, ox * dpr, oy * dpr);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      const sc = scene.current;
      if (sc) {
        sc.update(dt);
        sc.draw(ctx);
      }
      glitch.current.update(dt);
      glitch.current.draw(ctx, cv, { s: s * dpr, ox: ox * dpr, oy: oy * dpr });
      ctx.restore();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const onClick = (e) => {
    const r = canvas.current.getBoundingClientRect();
    const { s, ox, oy } = view.current;
    const x = (e.clientX - r.left - ox) / s;
    const y = (e.clientY - r.top - oy) / s;
    const line = glitch.current.hit(x, y);
    if (line && jumpRef.current) {
      play('click');
      jumpRef.current(line);
    }
  };

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden rounded-xl">
      <canvas ref={canvas} onClick={onClick} className={error ? 'cursor-pointer' : ''} aria-label="Simulación del motor en vivo" role="img" />
    </div>
  );
}
