"use client";

import { useEffect, useRef } from "react";

/**
 * Immersive WebGL fragment-shader hero backdrop.
 *
 * Design choices:
 *  - No three.js. Single fullscreen quad + custom fragment shader. ~4KB gzipped,
 *    no runtime scene graph, keeps home bundle lean.
 *  - Warm gold + charcoal palette, matching Executive Minimalist tokens.
 *  - Cursor drives a warp point that pulls the noise field toward it, creating
 *    a magnetic sense of depth without the "particle nebula" look.
 *  - DPR clamped to 1.5, paused on `visibilitychange`, killed on unmount.
 *  - Reduced-motion: don't mount — a static poster gradient renders under it.
 */
export function HeroShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vertSrc = /* glsl */ `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragSrc = /* glsl */ `
      precision highp float;
      varying vec2 v_uv;

      uniform vec2 u_res;
      uniform vec2 u_mouse;    // 0..1
      uniform vec2 u_mouseVel; // decays
      uniform float u_time;

      // Hash + value noise
      float hash(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = p * 2.05 + vec2(37.0, 17.0);
          a *= 0.5;
        }
        return v;
      }

      // OKLCH-ish charcoal
      vec3 ink   = vec3(0.055, 0.055, 0.06);
      vec3 ink2  = vec3(0.11, 0.11, 0.12);
      // Warm gold (approx sRGB of #D4AF37)
      vec3 gold  = vec3(0.83, 0.686, 0.216);
      vec3 gold2 = vec3(0.55, 0.41, 0.12);
      vec3 paper = vec3(0.985, 0.973, 0.965);

      void main() {
        vec2 uv = v_uv;
        vec2 res = u_res;
        float aspect = res.x / max(res.y, 1.0);

        // Center-aware coords for consistent scale
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

        // Mouse in same space
        vec2 m = (u_mouse - 0.5) * vec2(aspect, 1.0);

        // Distance to mouse w/ softening — creates the "warp point"
        float d = length(p - m);
        float warp = exp(-d * 3.2) * 0.55;

        // Flow: slow-drifting field, mouse velocity nudges it
        float t = u_time * 0.045;
        vec2 flow = vec2(
          fbm(p * 1.6 + vec2(t, -t * 0.7)) - 0.5,
          fbm(p * 1.6 + vec2(-t * 0.8, t)) - 0.5
        );

        // Pull the field toward mouse (magnetism)
        vec2 pull = (m - p) * warp;
        flow += pull * 0.9;
        flow += u_mouseVel * 1.2;

        // Second-order noise gives cloud/wisp topology
        float n = fbm(p * 2.4 + flow * 1.4);
        float ridge = pow(1.0 - abs(n - 0.5) * 2.0, 4.0);

        // Vignette + edge falloff so text stays legible
        float vig = smoothstep(1.25, 0.15, length(p * vec2(0.85, 1.15)));

        // Palette mixing
        vec3 col = mix(ink, ink2, smoothstep(0.2, 0.9, n));
        col = mix(col, gold2, ridge * 0.55 * vig);

        // Gold hotspot near the mouse — the "immersive" cue
        float hot = smoothstep(0.55, 0.0, d) * (0.4 + 0.6 * ridge);
        col = mix(col, gold, hot * 0.6 * vig);

        // Rim highlight
        float rim = smoothstep(0.6, 1.05, length(p)) * 0.25;
        col = mix(col, ink, rim);

        // Grain
        float g = (hash(uv * res * 0.5 + u_time) - 0.5) * 0.045;
        col += g;

        // Fade to charcoal at bottom for text baseline
        float floorFade = smoothstep(0.15, 0.55, uv.y);
        col = mix(ink * 1.0, col, floorFade);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[hero-shader] compile:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[hero-shader] link:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen triangle-strip quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uMouseVel = gl.getUniformLocation(program, "u_mouseVel");
    const uTime = gl.getUniformLocation(program, "u_time");

    const target = { x: 0.5, y: 0.35 };
    const smooth = { x: 0.5, y: 0.35 };
    const vel = { x: 0, y: 0 };
    let last = { x: 0.5, y: 0.35 };

    let raf = 0;
    let running = true;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let cx = 0, cy = 0;
      if ("touches" in e && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if ("clientX" in e) {
        cx = e.clientX;
        cy = e.clientY;
      }
      target.x = (cx - rect.left) / rect.width;
      target.y = 1 - (cy - rect.top) / rect.height;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) {
        last = { ...smooth };
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    function loop() {
      if (!running) return;
      const t = (performance.now() - start) / 1000;

      // Smoothed follow
      smooth.x += (target.x - smooth.x) * 0.09;
      smooth.y += (target.y - smooth.y) * 0.09;

      // Velocity from delta, decays each frame
      vel.x = (smooth.x - last.x) * 0.7 + vel.x * 0.85;
      vel.y = (smooth.y - last.y) * 0.7 + vel.y * 0.85;
      last = { x: smooth.x, y: smooth.y };

      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, smooth.x, smooth.y);
      gl!.uniform2f(uMouseVel, vel.x, vel.y);
      gl!.uniform1f(uTime, t);

      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
