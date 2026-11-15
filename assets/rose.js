// Personal-use web adaptation of IN BLOOM by JIN2 (@jin_22ee).
// Source: https://github.com/JIN2-ASCII/-JIN2-ASCII/tree/main/ROSE
(function () {
  const canvas = document.querySelector("#roseCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const W = 1080;
  const H = 960;
  const CELL_W = 9;
  const CELL_H = 14;
  const COLS = W / CELL_W;
  const ROWS = Math.floor(H / CELL_H);
  const LOOP = 20;
  const TAU = Math.PI * 2;
  const HEAD_Y = 0.22;
  const FLOOR = -1.22;
  const F = 2.9;
  const ASPECT = (COLS * CELL_W) / (ROWS * CELL_H);
  const POOLS = ["1il!;:", "rtfjcvxz=+", "aeoun0{}[]<>", "08B$#&%Q"];
  const COLORS = [
    [70, 214, 96], [52, 196, 84], [80, 206, 100], [255, 34, 64],
    [255, 120, 146], [255, 255, 255], [255, 176, 204], [188, 220, 255],
    [255, 214, 150], [140, 60, 76]
  ];
  const points = [];
  const eye = [0, 1.75, 4];
  const target = [0, -0.05, 0];
  const forward = normalize(sub(target, eye));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const random = rng(21);
  const glitter = Array.from({ length: 260 }, () => [random(), random(), random(), random(), random()]);

  function smooth(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function stemCurve(s) {
    return [0.045 * Math.sin(s * 3.1 + 0.4) - 0.02, -1.15 + s * (HEAD_Y + 1.15), 0.02 * Math.sin(s * 2.0)];
  }

  function addPoint(position, normal, order, kind, seed, details) {
    points.push({ position, normal: normalize(normal), order, kind, seed, ...(details || {}) });
  }

  function addStem() {
    for (let row = 0; row < 220; row += 1) {
      const s = row / 219;
      const center = stemCurve(s);
      const radius = 0.026 + 0.006 * (1 - s);
      for (let col = 0; col < 12; col += 1) {
        const phi = TAU * col / 12;
        const normal = [Math.cos(phi), 0, Math.sin(phi)];
        addPoint(add(center, mul(normal, radius)), normal, s, 0, row * 12 + col);
      }
    }
  }

  function leafPosition(at, side, leafLength, lift, twist, s, w) {
    const base = stemCurve(at);
    const direction = normalize([side * Math.cos(lift), Math.sin(lift), 0.25 * twist]);
    const wide = normalize(cross(direction, [0, 0, 1]));
    const leafUp = cross(wide, direction);
    const halfWidth = 0.15 * Math.pow(Math.sin(Math.PI * s), 0.75) * leafLength / 0.42;
    const p = add(base, mul(direction, 0.07 + s * leafLength));
    return add(add(p, mul(wide, w * halfWidth)), mul(leafUp, 0.05 * Math.abs(w) - 0.10 * s * s));
  }

  function addLeaf(at, side, leafLength, lift, twist, seedOffset) {
    for (let row = 0; row < 25; row += 1) {
      const s = row / 24;
      for (let col = 0; col < 15; col += 1) {
        const w = -1 + col / 7;
        const position = leafPosition(at, side, leafLength, lift, twist, s, w);
        const du = sub(leafPosition(at, side, leafLength, lift, twist, Math.min(1, s + 0.01), w), leafPosition(at, side, leafLength, lift, twist, Math.max(0, s - 0.01), w));
        const dv = sub(leafPosition(at, side, leafLength, lift, twist, s, Math.min(1, w + 0.01)), leafPosition(at, side, leafLength, lift, twist, s, Math.max(-1, w - 0.01)));
        let normal = normalize(cross(du, dv));
        const leafUp = normalize(cross(normalize(cross(normalize([side * Math.cos(lift), Math.sin(lift), 0.25 * twist]), [0, 0, 1])), normalize([side * Math.cos(lift), Math.sin(lift), 0.25 * twist])));
        if (dot(normal, leafUp) < 0) normal = mul(normal, -1);
        addPoint(position, normal, at + 0.05 + s * 0.25, 1, seedOffset + row * 15 + col);
      }
    }
  }

  function sepalPosition(index, s, w, open) {
    const beta = (1.05 + 0.35 * open) + (0.55 + 0.75 * open) * s;
    const length = 0.36 - 0.06 * open;
    const angle = TAU * index / 5 + 0.3;
    const radius = 0.045 + length * s * Math.sin(beta);
    const turn = angle + w * 0.10 * Math.pow(1 - s, 1.3) / Math.max(radius / 0.2, 0.25);
    const y = HEAD_Y + 0.02 + length * s * Math.cos(beta);
    return [Math.cos(turn) * radius, y, Math.sin(turn) * radius];
  }

  function addSepals() {
    for (let flower = 0; flower < 5; flower += 1) {
      for (let row = 0; row < 34; row += 1) {
        const s = row / 33;
        for (let col = 0; col < 9; col += 1) {
          const w = -1 + col / 4;
          addPoint(sepalPosition(flower, s, w, 0), sepalNormal(flower, s), 1 + 0.10 * s, 2, flower * 306 + row * 9 + col, {
            openPosition: sepalPosition(flower, s, w, 1)
          });
        }
      }
    }
  }

  function sepalNormal(index, s) {
    const angle = TAU * index / 5 + 0.3;
    return [Math.cos(angle) * (0.7 + 0.3 * s), 0.25, Math.sin(angle) * (0.7 + 0.3 * s)];
  }

  const TH_START = 2.2 * Math.PI;
  const TH_END = 20 * Math.PI;
  const PETAL_MIN_ID = Math.floor(3.6 * TH_START / TAU);

  function petalPositions(theta, v, thn) {
    const A = 5.6;
    const phi = (Math.PI / 2) * Math.exp(-theta / (A * Math.PI));
    const wave = 1 - 0.5 * Math.pow(1.25 * (1 - ((3.6 * theta % TAU) / Math.PI)) ** 2 - 0.25, 2);
    const curve = 1.95653 * v * v * Math.pow(1.27689 * v - 1, 2) * Math.sin(phi);
    const radius = wave * (v * Math.sin(phi) + curve * Math.cos(phi));
    const openPosition = [radius * Math.sin(theta) * 0.8, wave * (v * Math.cos(phi) - curve * Math.sin(phi)) * 0.8 + HEAD_Y, radius * Math.cos(theta) * 0.8];
    const budRadius = 0.170 * Math.pow(v, 0.70) * Math.pow(1 - v, 0.75) / 0.367 * (1 - 0.30 * thn) + 0.003;
    const closedPosition = [budRadius * Math.sin(theta), HEAD_Y + 0.03 + 0.52 * v * (1 - 0.06 * thn), budRadius * Math.cos(theta)];
    return { closedPosition, openPosition };
  }

  function addPetals() {
    const thetaSteps = 500;
    const vSteps = 24;
    for (let row = 0; row < thetaSteps; row += 1) {
      const theta = TH_START + (TH_END - TH_START) * row / (thetaSteps - 1);
      const thn = row / (thetaSteps - 1);
      const petalId = Math.floor(3.6 * theta / TAU) - PETAL_MIN_ID;
      for (let col = 0; col < vSteps; col += 1) {
        const v = col / (vSteps - 1);
        const { closedPosition, openPosition } = petalPositions(theta, v, thn);
        const shell = 1 - thn;
        const edge = v > 0.93;
        addPoint(closedPosition, [Math.sin(theta), 0.2, Math.cos(theta)], 1.10 + v * 0.42 + shell * 0.10, 3, row * vSteps + col, {
          openPosition,
          shell,
          petalId,
          v,
          edge
        });
      }
    }
  }

  addStem();
  addLeaf(0.32, -1, 0.42, 0.35, 1, 3000);
  addLeaf(0.55, 1, 0.36, 0.45, -1, 4000);
  addSepals();
  addPetals();

  function bloom(t) {
    const u = Math.max(0, Math.min(1, (t - 5.5) / 9));
    return u * (2 - u) * 0.55 + u * u * (3 - 2 * u) * 0.45;
  }

  function sway(t) {
    return 0.22 * Math.sin(Math.max(t - 7, 0) * 0.35) * smooth((t - 7) / 4);
  }

  function project(position, yaw) {
    const cosine = Math.cos(yaw);
    const sine = Math.sin(yaw);
    const rotated = [cosine * position[0] + sine * position[2], position[1], -sine * position[0] + cosine * position[2]];
    const relative = sub(rotated, eye);
    const x = dot(relative, right);
    const y = dot(relative, up);
    const depth = dot(relative, forward);
    if (depth <= 0.2) return null;
    return {
      x: (0.5 + x / depth * F * 0.5) * COLS,
      y: (0.5 - y / depth * F * 0.5 * ASPECT) * ROWS,
      depth
    };
  }

  function setParticle(grid, colors, levels, depths, x, y, depth, char, color, strength) {
    const col = Math.floor(x);
    const row = Math.floor(y);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const index = row * COLS + col;
    if (grid[index] || depth >= depths[index]) return;
    grid[index] = char;
    colors[index] = color;
    levels[index] = Math.max(0, Math.min(1, strength));
    depths[index] = depth;
  }

  function render(seconds) {
    const t = seconds;
    const open = bloom(t);
    const petalBlend = smooth(open / 0.6);
    const yaw = sway(t);
    const grid = new Array(COLS * ROWS).fill("");
    const colors = new Uint8Array(COLS * ROWS);
    const levels = new Float32Array(COLS * ROWS);
    const depths = new Float32Array(COLS * ROWS);
    depths.fill(Infinity);
    const head = (t - 0.3) / (5.4 - 0.3) * 1.66;
    const key = normalize([-0.35, 0.85, 0.65]);
    const rim = normalize([Math.cos(t * 0.8), 0.4, Math.sin(t * 0.8)]);

    for (const point of points) {
      const reveal = smooth((head - point.order) / (point.order >= 1 ? 0.09 : 0.05));
      if (reveal < 0.96) continue;
      const destination = point.openPosition || point.position;
      const position = point.openPosition
        ? [
            point.position[0] * (1 - petalBlend) + destination[0] * petalBlend,
            point.position[1] * (1 - petalBlend) + destination[1] * petalBlend,
            point.position[2] * (1 - petalBlend) + destination[2] * petalBlend
          ]
        : point.position;
      const screen = project(position, yaw);
      if (!screen || screen.x < 0 || screen.x >= COLS || screen.y < 0 || screen.y >= ROWS) continue;
      const normal = [
        Math.cos(yaw) * point.normal[0] + Math.sin(yaw) * point.normal[2],
        point.normal[1],
        -Math.sin(yaw) * point.normal[0] + Math.cos(yaw) * point.normal[2]
      ];
      const diffuse = Math.max(0, dot(normal, key));
      const highlight = Math.pow(Math.max(0, dot(normal, rim)), 10);
      const shellShade = point.kind === 3 ? 0.74 + 0.26 * point.shell : 1;
      const shade = Math.min(1, (0.62 + 0.48 * diffuse + 0.24 * highlight) * shellShade);
      let color = point.kind === 0 ? 0 : point.kind === 1 ? 1 : point.kind === 2 ? 2 : point.edge ? 5 : point.shell > 0.7 ? 4 : 3;
      const flicker = Math.sin(t * 2 + point.seed * 0.13);
      if (point.kind === 3 && (point.seed % 191 === 0) && flicker > 0.78) color = 5;
      const level = Math.max(0, Math.min(3, Math.floor(shade * 3.2)));
      const hash = (Math.floor(screen.y) * 7919 + Math.floor(screen.x) * 104729 + point.seed) % 9973;
      const glyphPool = POOLS[level];
      const char = glyphPool[(hash + Math.floor(t * 4 + hash % 11)) % glyphPool.length];
      const col = Math.floor(screen.x);
      const row = Math.floor(screen.y);
      const index = row * COLS + col;
      if (screen.depth >= depths[index]) continue;
      grid[index] = point.edge ? (point.seed % 2 ? "/" : "\\") : char;
      colors[index] = color;
      levels[index] = point.edge ? Math.max(0.85, shade) : shade;
      depths[index] = screen.depth;
    }

    for (let i = 0; i < glitter.length; i += 1) {
      const [a0, speed, radiusSeed, heightSeed, phase] = glitter[i];
      const angle = a0 * TAU + t * (0.05 + 0.08 * speed);
      const radius = 0.55 + 1.6 * Math.pow(radiusSeed, 0.7);
      const y = -1.1 + 2.3 * heightSeed + 0.05 * Math.sin(t * 0.6 + phase * TAU);
      const position = [Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.6 - 0.35];
      const twinkle = Math.pow(Math.max(0, Math.sin(t * (1.2 + 2.5 * speed) + phase * 40)), 6);
      const glow = (0.10 + 0.85 * twinkle) * smooth((t - 1 - heightSeed * 3) / 1.5);
      if (glow < 0.35) continue;
      const screen = project(position, yaw);
      if (!screen) continue;
      const color = phase < 0.12 ? 8 : phase < 0.3 ? 7 : 5;
      setParticle(grid, colors, levels, depths, screen.x, screen.y, screen.depth, glow > 0.75 ? "*" : ".", color, glow);
    }

    const dropTimes = [13.4, 14.9, 16.2, 17.4];
    for (let i = 0; i < dropTimes.length; i += 1) {
      const age = t - dropTimes[i];
      if (age < 0 || age > 3.8) continue;
      const angle = 1.1 + i * 1.18;
      const start = [Math.sin(angle) * 0.52, HEAD_Y + 0.14, Math.cos(angle) * 0.52];
      const hang = 1.4;
      const drop = age < hang ? 0 : age - hang;
      const position = [start[0], start[1] - 0.5 * 1.7 * drop * drop, start[2]];
      const screen = project(position, yaw);
      if (!screen) continue;
      if (age < hang) {
        setParticle(grid, colors, levels, depths, screen.x, screen.y, screen.depth, "o", 7, 0.8 + 0.15 * age);
      } else if (position[1] > FLOOR) {
        setParticle(grid, colors, levels, depths, screen.x, screen.y, screen.depth, "|", 7, 0.9);
      } else {
        const splash = age - hang - Math.sqrt(2 * (start[1] - FLOOR) / 1.7);
        if (splash >= 0 && splash < 0.7) {
          setParticle(grid, colors, levels, depths, screen.x + Math.cos(i * 2 + splash * 8) * splash * 8, screen.y - splash * 7, screen.depth, "+", 7, 0.7 * (1 - splash));
        }
      }
    }

    ctx.fillStyle = seconds === 0 ? "#000" : "rgba(0,0,0,.46)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "15px Consolas, Menlo, 'DejaVu Sans Mono', 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < grid.length; i += 1) {
      if (!grid[i]) continue;
      const rgb = COLORS[colors[i]];
      const brightness = Math.max(0.06, Math.min(1, levels[i]));
      ctx.fillStyle = "rgb(" + Math.round(rgb[0] * brightness) + " " + Math.round(rgb[1] * brightness) + " " + Math.round(rgb[2] * brightness) + ")";
      ctx.fillText(grid[i], (i % COLS) * CELL_W + CELL_W / 2, Math.floor(i / COLS) * CELL_H + CELL_H / 2);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "rgb(255 122 182)";
    ctx.fillText("bloom " + (open * 100).toFixed(0) + "%", W - 64, 35);
  }

  window.startRoseAnimation = function (onComplete) {
    let startTime = null;
    let lastRenderTime = 0;
    let frameId = 0;
    let active = true;
    let visibilityChecked = false;
    canvas.hidden = false;

    function frame(now) {
      if (!active) return;
      if (startTime === null) startTime = now;
      if (lastRenderTime && now - lastRenderTime < 1000 / 30 && now - startTime < LOOP * 1000) {
        frameId = window.requestAnimationFrame(frame);
        return;
      }
      lastRenderTime = now;
      const elapsed = Math.min((now - startTime) / 1000, LOOP);
      try {
        render(elapsed);
        if (!visibilityChecked && elapsed >= 1.5) {
          visibilityChecked = true;
          const pixels = ctx.getImageData(0, 0, W, H).data;
          let visible = false;
          for (let i = 0; i < pixels.length; i += 32) {
            if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 100) {
              visible = true;
              break;
            }
          }
          if (!visible && window.reportIntroError) window.reportIntroError("IN BLOOM canvas berjalan, tetapi tidak menghasilkan piksel yang terlihat.");
        }
      } catch (error) {
        console.error("IN BLOOM canvas renderer failed:", error);
        if (window.reportIntroError) window.reportIntroError("IN BLOOM canvas: " + (error.stack || error.message || String(error)));
        active = false;
        onComplete();
        return;
      }
      if (elapsed >= LOOP) {
        active = false;
        onComplete();
        return;
      }
      frameId = window.requestAnimationFrame(frame);
    }

    frameId = window.requestAnimationFrame(frame);
    return function stopRoseAnimation() {
      active = false;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  };

  function rng(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, scalar) { return [a[0] * scalar, a[1] * scalar, a[2] * scalar]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function length(a) { return Math.sqrt(dot(a, a)); }
  function normalize(a) { return mul(a, 1 / (length(a) || 1)); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
})();
