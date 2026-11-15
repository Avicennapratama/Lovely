(function () {
  const canvas = document.querySelector("#birthdayCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const W = 1080;
  const H = 960;
  const CELL_W = 9;
  const CELL_H = 14;
  const COLS = 120;
  const ROWS = 68;
  const LOOP = 18;
  const BUILD = 3.4;
  const F = 2.9;
  const R = 1.6;
  const FT = 0.08;
  const TOP = 0.98;
  const A0 = -28 * Math.PI / 180;
  const A1 = 30 * Math.PI / 180;
  const CENTER = [1, 0, 0];
  const CANDLE = [0.62 * R, 0, 0];
  const CHARS = " .,:~+*^01|/\\-_#()x";
  const POOLS = ["1il!;:", "rtfjcvxz=+", "aeoun0{}[]<>", "08B$#&%Q"];
  const MATERIAL = { sponge: 0, crust: 1, cream: 2, frosting: 3, red: 4, redHi: 5, plate: 6, gold: 7, core: 8, flame: 9, glow: 10, wick: 11, litSponge: 12, litFrost: 13, happy: 14, birthday: 15 };
  const COLORS = [
    [236,160,52], [150,84,36], [255,250,238], [255,246,232],
    [240,50,70], [255,140,150], [232,222,206], [228,176,84],
    [255,250,228], [255,158,52], [255,184,96], [90,70,60],
    [255,184,72], [255,226,168], [255,212,138], [255,176,204],
    [255,96,160], [70,160,255], [60,200,110], [255,214,50], [255,128,40], [245,245,255]
  ];
  const DOTS = [16,17,18,19,20,21];
  const eye = [1, 2.6, 7];
  const target = [1, 1.45, 0];
  const fwd = normalize(sub(target, eye));
  const right = normalize(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const keyLight = normalize([-0.5, 0.8, 0.6]);
  const rimLight = [0.8, 0.3, -0.5];
  const points = [];
  const textCanvas = document.createElement("canvas");
  textCanvas.width = W;
  textCanvas.height = H;
  const textCtx = textCanvas.getContext("2d", { willReadFrequently: true });

  function addPoint(position, normal, material, scale, random) {
    const order = (position[1] + 0.12) / 2.3 + random() * 0.1;
    const fly = random() < 1 / 30
      ? [(random() - 0.5) * 4.4, (random() - 0.5) * 4.4, (random() - 0.5) * 4.4]
      : [0, 0, 0];
    points.push({ position, normal: normalize(normal), material, order, fly, scale });
  }

  function makeCake() {
    const random = rng(7);
    const dot = (a) => [Math.cos(a), 0, -Math.sin(a)];
    const frosting = (x, z) => {
      const radius = Math.hypot(x, z);
      const angle = Math.atan2(-z, x);
      const edge = 0.15 * Math.exp(-Math.pow((radius - 1.3) / 0.26, 2)) * (0.55 + 0.45 * Math.sin(angle * 22 - radius * 14));
      const candleDistance = Math.hypot(x - CANDLE[0], z - CANDLE[2]);
      const swirl = 0.2 * Math.exp(-Math.pow(candleDistance / 0.34, 2)) * (0.6 + 0.4 * Math.sin(Math.atan2(z, x - CANDLE[0]) * 3 + candleDistance * 30));
      return TOP + 0.04 + edge + swirl;
    };

    for (const [angle, side] of [[A0, 1], [A1, -1]]) {
      for (let i = 0; i < 9000; i += 1) {
        const radius = random() * (R + FT);
        const y = random() * TOP;
        const crust = y < 0.05 || (y > 0.37 && y < 0.42) || (y > 0.56 && y < 0.6) || (y > 0.9 && y < 0.95);
        const cream = y > 0.42 && y < 0.56;
        const frost = y >= 0.95 || radius > R;
        const material = frost ? MATERIAL.frosting : cream ? MATERIAL.cream : crust ? MATERIAL.crust : MATERIAL.sponge;
        const normal = [side * Math.sin(angle), 0, side * Math.cos(angle)];
        addPoint(add(mul(dot(angle), radius), [0, y, 0]), normal, material, frost ? 3 : cream ? 2 : 1, random);
      }
    }

    for (let i = 0; i < 9000; i += 1) {
      const angle = A0 + random() * (A1 - A0);
      const y = random() * (TOP + 0.04);
      const wave = 0.025 * Math.sin(angle * 40 + y * 9);
      addPoint(add(mul(dot(angle), R + FT + wave), [0, y, 0]), dot(angle), MATERIAL.frosting, 3, random);
    }

    for (let i = 0; i < 12000; i += 1) {
      const radius = (R + FT) * Math.sqrt(random());
      const angle = A0 + random() * (A1 - A0);
      const ring = dot(angle);
      const x = radius * ring[0];
      const z = radius * ring[2];
      const y = frosting(x, z);
      const epsilon = 0.01;
      const nx = -(frosting(x + epsilon, z) - y) / epsilon;
      const nz = -(frosting(x, z + epsilon) - y) / epsilon;
      addPoint([x, y, z], [nx, 1, nz], MATERIAL.frosting, 3, random);
    }

    const candleBase = frosting(CANDLE[0], CANDLE[2]) - 0.05;
    for (let i = 0; i < 2500; i += 1) {
      const angle = random() * Math.PI * 2;
      const y = random() * 0.62;
      const normal = [Math.cos(angle), 0, Math.sin(angle)];
      const material = Math.sin(angle + y * 16) > 0.45 ? MATERIAL.redHi : MATERIAL.red;
      addPoint(add(CANDLE, add(mul(normal, 0.075), [0, candleBase + y, 0])), normal, material, 4, random);
    }
    for (let i = 0; i < 30; i += 1) {
      const y = candleBase + 0.62 + i / 29 * 0.07;
      addPoint(add(CANDLE, [0, y, 0]), [0, 0, 1], MATERIAL.wick, 4, random);
    }

    const plateRadius = 1.3;
    for (let i = 0; i < 9000; i += 1) {
      const angle = random() * Math.PI * 2;
      const u = Math.sqrt(random());
      const rim = plateRadius + 0.06 * Math.sin(angle * 12);
      const radius = u * rim;
      const y = -0.02 + 0.06 * Math.pow(u, 4);
      addPoint([1 + radius * Math.cos(angle), y, radius * Math.sin(angle)], [0, 1, 0], u > 0.93 ? MATERIAL.gold : MATERIAL.plate, 0, random);
    }
    for (let i = 0; i < 3000; i += 1) {
      const angle = random() * Math.PI * 2;
      const y = -0.1 + random() * 0.14;
      const rim = plateRadius + 0.06 * Math.sin(angle * 12);
      addPoint([1 + rim * Math.cos(angle), y, rim * Math.sin(angle)], [Math.cos(angle), 0, Math.sin(angle)], MATERIAL.gold, 0, random);
    }

    for (let i = 0; i < 90; i += 1) {
      const radius = 0.25 + random() * (R - 0.25);
      const angle = A0 + 0.05 + random() * (A1 - A0 - 0.1);
      const ring = dot(angle);
      const x = radius * ring[0];
      const z = radius * ring[2];
      if (Math.hypot(x - CANDLE[0], z - CANDLE[2]) < 0.12) continue;
      const center = [x, frosting(x, z) + 0.02, z];
      addSprinkle(center, random, MATERIAL.frosting);
    }
    for (let i = 90; i < 110; i += 1) {
      const angle = 1.2 + random() * 3.4;
      const radius = 0.95 + random() * 0.25;
      addSprinkle([1 + radius * Math.cos(angle), 0, radius * Math.sin(angle)], random, MATERIAL.plate);
    }
  }

  function addSprinkle(center, random, unusedMaterial) {
    const direction = normalize([(random() - 0.5) * 2, (random() - 0.5) * 0.6, (random() - 0.5) * 2]);
    const material = DOTS[Math.floor(random() * DOTS.length)];
    for (let i = 0; i < 10; i += 1) {
      const offset = (i / 9 - 0.5) * 0.12;
      addPoint(add(center, mul(direction, offset)), [0, 1, 0], material, 5, random);
    }
  }

  function smooth(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function pop(value) {
    const q = value - 1;
    return 1 + 2.70158 * q * q * q + 1.70158 * q * q;
  }

  function rotateY(point, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [c * point[0] + s * point[2], point[1], -s * point[0] + c * point[2]];
  }

  function project(point) {
    const relative = sub(point, eye);
    const x = dotProduct(relative, right);
    const y = dotProduct(relative, up);
    const z = Math.max(0.2, dotProduct(relative, fwd));
    return { x: (0.5 + x / z * F * 0.5) * COLS, y: (0.5 - y / z * F * 0.5 * ((COLS * CELL_W) / (ROWS * CELL_H))) * ROWS, z };
  }

  function render(seconds) {
    const t = seconds % LOOP;
    const turn = 0.95 + 0.18 * Math.sin(t * 0.72);
    const cells = new Int16Array(COLS * ROWS);
    const depth = new Float32Array(COLS * ROWS);
    const light = new Float32Array(COLS * ROWS);
    const tag = new Int16Array(COLS * ROWS);
    depth.fill(99);
    cells.fill(-1);
    const flicker = 0.82 + 0.1 * Math.sin(t * 13) + 0.06 * Math.sin(t * 29 + 1) + 0.04 * Math.sin(t * 47 + 2);
    const flameOn = smooth((t - 3.2) / 0.8);
    const candleTip = add(rotateY([CANDLE[0] - CENTER[0], 1.72, 0], turn), CENTER);
    const candleLight = [candleTip[0] + 0.03 * Math.sin(t * 2.3), candleTip[1] + 0.18, candleTip[2] + 0.05];
    const view = mul(fwd, -1);
    const halfKey = normalize(add(keyLight, view));
    const halfRim = normalize(add(rimLight, view));
    const buildHead = (t - 0.2) / (BUILD - 0.2) * 1.25;

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const reveal = smooth((buildHead - point.order) / 0.12);
      if (reveal <= 0.01) continue;
      const local = sub(point.position, CENTER);
      const rotated = add(rotateY(local, turn), CENTER);
      const moved = add(rotated, mul(point.fly, 1 - reveal));
      const normal = rotateY(point.normal, turn);
      const screen = project(moved);
      const x = Math.floor(screen.x);
      const y = Math.floor(screen.y);
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS || screen.z >= depth[y * COLS + x]) continue;
      const diff = Math.max(0, dotProduct(normal, keyLight));
      const spec = Math.pow(Math.max(0, dotProduct(normal, halfKey)), 24) + 0.7 * Math.pow(Math.max(0, dotProduct(normal, halfRim)), 18);
      const toLight = sub(candleLight, moved);
      const distance = Math.max(0.001, length(toLight));
      const warm = flameOn * flicker * Math.max(0.3, dotProduct(normal, mul(toLight, 1 / distance))) * Math.exp(-Math.pow(distance / 1.6, 2)) * 1.3;
      let brightness = (0.3 + 0.45 * diff + 0.12 * spec + 0.45 * warm) * reveal;
      if (point.material === MATERIAL.plate || point.material === MATERIAL.gold) brightness *= 0.6;
      let material = point.material;
      if (warm > 0.3 && material === MATERIAL.sponge) material = MATERIAL.litSponge;
      if (warm > 0.3 && material === MATERIAL.frosting) material = MATERIAL.litFrost;
      const index = y * COLS + x;
      depth[index] = screen.z;
      cells[index] = material;
      light[index] = Math.max(0, Math.min(1, brightness));
      tag[index] = material;
    }

    addFlame(t, flameOn, flicker, cells, depth, light, tag, candleTip);
    const chars = new Array(COLS * ROWS).fill(" ");
    const colorIds = new Int16Array(COLS * ROWS);
    const hashes = new Uint32Array(COLS * ROWS);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const i = y * COLS + x;
        if (cells[i] < 0) continue;
        const hash = ((y * 7919 + x * 104729) % 9973);
        hashes[i] = hash;
        const level = Math.max(0, Math.min(3, Math.floor(light[i] * 3.2)));
        const pool = POOLS[level];
        chars[i] = pool[(hash + Math.floor(t * 4 + hash % 11)) % pool.length];
        colorIds[i] = materialColor(cells[i]);
      }
    }

    drawOutlines(chars, cells, depth, colorIds, light);
    drawMaterialTexture(t, chars, cells, hashes);
    addHalo(t, flameOn, flicker, chars, colorIds, light, tag, hashes, candleLight);
    addConfetti(t, chars, colorIds, light, tag);
    drawBirthdayWords(t, chars, colorIds, light, hashes);
    paint(chars, colorIds, light);
  }

  function addFlame(t, grow, flicker, cells, depth, light, tag, tip) {
    if (grow <= 0) return;
    const random = rng(3);
    for (let i = 0; i < 900; i += 1) {
      const u = random() * 2 - 1;
      const v = random();
      const width = 0.15 * Math.sin(Math.PI * Math.pow(v, 0.75)) * (1 - 0.35 * v);
      const lean = 0.05 * Math.sin(t * 2.3) + 0.02 * Math.sin(t * 7);
      const point = [tip[0] + u * width * grow + lean * v * v, tip[1] + (v - 0.12) * 0.6 * flicker * grow, tip[2] + 0.05];
      const screen = project(point);
      const x = Math.floor(screen.x);
      const y = Math.floor(screen.y);
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
      const index = y * COLS + x;
      if (screen.z > depth[index]) continue;
      depth[index] = screen.z;
      cells[index] = Math.abs(u) < 0.5 && v < 0.62 ? MATERIAL.core : MATERIAL.flame;
      light[index] = 0.6 + 0.4 * grow;
      tag[index] = cells[index];
    }
  }

  function drawOutlines(chars, cells, depth, colorIds, light) {
    const source = chars.slice();
    for (let y = 1; y < ROWS - 1; y += 1) {
      for (let x = 1; x < COLS - 1; x += 1) {
        const i = y * COLS + x;
        if (cells[i] < 0) continue;
        const left = i - 1;
        const rightIndex = i + 1;
        const upIndex = i - COLS;
        const downIndex = i + COLS;
        const edgeLeft = cells[left] < 0 || (cells[left] !== cells[i] && depth[left] > depth[i] + 0.035);
        const edgeRight = cells[rightIndex] < 0 || (cells[rightIndex] !== cells[i] && depth[rightIndex] > depth[i] + 0.035);
        const edgeUp = cells[upIndex] < 0 || (cells[upIndex] !== cells[i] && depth[upIndex] > depth[i] + 0.035);
        const edgeDown = cells[downIndex] < 0 || (cells[downIndex] !== cells[i] && depth[downIndex] > depth[i] + 0.035);
        if (!(edgeLeft || edgeRight || edgeUp || edgeDown)) continue;
        chars[i] = edgeLeft || edgeRight ? "|" : edgeDown ? "_" : "-";
        light[i] = Math.max(0.5, light[i]);
        colorIds[i] = materialColor(cells[i]);
      }
    }
  }

  function drawMaterialTexture(t, chars, cells, hashes) {
    for (let i = 0; i < chars.length; i += 1) {
      const material = cells[i];
      if (material < 0 || chars[i] === "|" || chars[i] === "_" || chars[i] === "-" || chars[i] === "/" || chars[i] === "\\") continue;
      const hash = hashes[i];
      if (material === MATERIAL.sponge || material === MATERIAL.litSponge) chars[i] = "o0ae.:o0"[(hash + Math.floor(t * 2) * (hash % 3 === 0 ? 1 : 0)) % 8];
      else if (material === MATERIAL.crust) chars[i] = "=";
      else if (material === MATERIAL.cream) chars[i] = "~";
      else if (material === MATERIAL.frosting || material === MATERIAL.litFrost) chars[i] = hash % 5 === 0 ? "^" : "~";
      else if (material === MATERIAL.plate) chars[i] = hash % 4 === 0 ? ":" : ".";
      else if (material === MATERIAL.gold) chars[i] = "=";
    }
  }

  function addHalo(t, on, flicker, chars, colorIds, light, tag, hashes, lightPoint) {
    if (on <= 0) return;
    const screen = project(lightPoint);
    const cy = Math.floor(screen.y);
    const cx = Math.floor(screen.x);
    const radius = (6 + 1.5 * flicker) * on;
    for (let y = Math.max(0, cy - 12); y < Math.min(ROWS, cy + 13); y += 1) {
      for (let x = Math.max(0, cx - 12); x < Math.min(COLS, cx + 13); x += 1) {
        const i = y * COLS + x;
        const falloff = 1 - Math.hypot(y - cy, (x - cx) * 9 / 14) / radius;
        if (chars[i] !== " " || falloff <= 0 || (hashes[i] + Math.floor(t * 9)) % 3 === 0) continue;
        chars[i] = falloff < 0.4 ? "." : falloff < 0.7 ? ":" : "+";
        colorIds[i] = MATERIAL.glow;
        light[i] = 0.6 * falloff * on * flicker;
        tag[i] = MATERIAL.glow;
      }
    }
  }

  function addConfetti(t, chars, colorIds, light, tag) {
    for (let i = 0; i < 110; i += 1) {
      const seed = i + 11;
      const x0 = randomAt(seed, 1) * COLS;
      const speed = 4 + randomAt(seed, 2) * 5;
      const delay = randomAt(seed, 3) * 5;
      const amplitude = 1 + randomAt(seed, 4) * 3;
      const frequency = 1 + randomAt(seed, 5) * 1.5;
      const phase = randomAt(seed, 6) * Math.PI * 2;
      const age = t - 4.8 - delay;
      if (age < 0) continue;
      const y = Math.floor(age * speed % (ROWS + 4)) - 2;
      const x = Math.floor(x0 + amplitude * Math.sin(frequency * t + phase));
      if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
      const index = y * COLS + x;
      if (chars[index] !== " " && tag[index] !== MATERIAL.glow) continue;
      chars[index] = i % 7 ? "-/|\\"[Math.floor(t * frequency * 3 + phase) % 4] : "o";
      colorIds[index] = DOTS[i % DOTS.length];
      light[index] = 0.85;
      tag[index] = colorIds[index];
    }
  }

  function drawBirthdayWords(t, chars, colorIds, light, hashes) {
    for (const [word, at, row, material] of [["HAPPY", 5.1, 0.09, MATERIAL.happy], ["BIRTHDAY", 5.65, 0.21, MATERIAL.birthday]]) {
      const progress = Math.max(0, Math.min(1, (t - at) / 0.5));
      if (progress <= 0) continue;
      textCtx.clearRect(0, 0, W, H);
      const overshoot = pop(progress);
      const size = Math.floor(136 * (1.55 - 0.55 * overshoot));
      textCtx.font = "900 " + size + "px Arial Black, Arial, sans-serif";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "white";
      textCtx.fillText(word, W / 2, H * row);
      const coverage = textCtx.getImageData(0, 0, W, H).data;
      const threshold = smooth(progress * 1.6);
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const i = y * COLS + x;
          if ((hashes[i] % 997) / 997 >= threshold) continue;
          const sample = ((y * CELL_H + Math.floor(CELL_H / 2)) * W + x * CELL_W + Math.floor(CELL_W / 2)) * 4 + 3;
          if (coverage[sample] < 116) continue;
          const neighboring = x > 0 && coverage[sample - 4 * CELL_W] < 116 || x < COLS - 1 && coverage[sample + 4 * CELL_W] < 116 || y > 0 && coverage[sample - 4 * CELL_H * W] < 116 || y < ROWS - 1 && coverage[sample + 4 * CELL_H * W] < 116;
          chars[i] = neighboring ? "#" : POOLS[3][(hashes[i] + Math.floor(t * 4) + hashes[i] % 11) % POOLS[3].length];
          colorIds[i] = material;
          light[i] = Math.min(1, 0.8 + 0.2 * Math.sin(t * 3 - x * 0.12)) * (1 + 0.5 * (1 - progress));
        }
      }
    }
  }

  function paint(chars, colorIds, light) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "15px Consolas, Menlo, 'DejaVu Sans Mono', 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      if (char === " ") continue;
      const rgb = COLORS[Math.max(0, Math.min(COLORS.length - 1, colorIds[i]))];
      const brightness = Math.max(0.06, Math.min(1, light[i]));
      const red = Math.round(rgb[0] * brightness);
      const green = Math.round(rgb[1] * brightness);
      const blue = Math.round(rgb[2] * brightness);
      ctx.fillStyle = "rgb(" + red + " " + green + " " + blue + ")";
      ctx.fillText(char, (i % COLS) * CELL_W + CELL_W / 2, Math.floor(i / COLS) * CELL_H + CELL_H / 2);
    }
  }

  function materialColor(material) {
    return material;
  }

  function rng(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function randomAt(seed, lane) {
    let x = (seed * 374761393 + lane * 668265263) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, scalar) { return [a[0] * scalar, a[1] * scalar, a[2] * scalar]; }
  function dotProduct(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function length(a) { return Math.sqrt(dotProduct(a, a)); }
  function normalize(a) { return mul(a, 1 / (length(a) || 1)); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  function canvasHasVisiblePixels() {
    try {
      const pixels = ctx.getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y += 8) {
        for (let x = 0; x < W; x += 8) {
          const i = (y * W + x) * 4;
          if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 90) return true;
        }
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  window.startBirthdayCake = function (button) {
    let startTime = null;
    let frameId = 0;
    let active = true;
    canvas.hidden = false;
    let visibilityChecked = false;
    let firstPixelProbeDone = false;
    try {
      makeCake();
    } catch (error) {
      console.error("Birthday Cake geometry failed:", error);
      if (window.reportIntroError) window.reportIntroError("BIRTHDAY-CAKE geometry: " + (error.stack || error.message || String(error)));
      canvas.hidden = true;
      button.hidden = false;
      return function stopBirthdayCake() {};
    }
    function frame(now) {
      if (!active) return;
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;
      try {
        render(elapsed);
        if (!firstPixelProbeDone && elapsed >= 0.25) {
          firstPixelProbeDone = true;
          if (canvasHasVisiblePixels()) {
            visibilityChecked = true;
          }
        }
        if (!visibilityChecked && elapsed >= BUILD) {
          visibilityChecked = true;
          const visible = canvasHasVisiblePixels();
          if (visible) {
          } else {
            canvas.hidden = true;
            button.hidden = false;
            if (window.reportIntroError) window.reportIntroError("BIRTHDAY-CAKE canvas berjalan, tetapi tidak menghasilkan piksel yang terlihat.");
            active = false;
            return;
          }
        }
      } catch (error) {
        console.error("Birthday Cake canvas renderer failed:", error);
        if (window.reportIntroError) window.reportIntroError("BIRTHDAY-CAKE canvas: " + (error.stack || error.message || String(error)));
        active = false;
        canvas.hidden = true;
        button.hidden = false;
        return;
      }
      if (elapsed >= LOOP) button.hidden = false;
      frameId = window.requestAnimationFrame(frame);
    }
    frameId = window.requestAnimationFrame(frame);
    return function stopBirthdayCake() {
      active = false;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  };
})();
