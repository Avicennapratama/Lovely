(function () {
  const canvas = document.querySelector("#loveCanvas");
  if (!canvas || !window.LOVE_PHRASES) return;

  const ctx = canvas.getContext("2d");
  const fallback = document.querySelector(".canvas-fallback");
  const W = 1080;
  const H = 960;
  const CX = 540;
  const CY = 480;
  const WIDTH = 840;
  const TEXT_PX = 19;
  const PITCH = 21;
  const GAP = 14;
  const BUILD = 3;
  const TURN = 10;
  const WALL = 22;
  const DOME = 70;
  const phrases = window.LOVE_PHRASES;
  const rtlLanguages = new Set(["Arabic", "Hebrew", "Persian", "Pashto", "Urdu", "Yiddish", "Uyghur"]);
  const HALF = [
    [0.0, -0.3575], [0.0301, -0.3662], [0.0563, -0.3844], [0.0825, -0.4024], [0.109, -0.4199],
    [0.1373, -0.4328], [0.1671, -0.4422], [0.1981, -0.4489], [0.231, -0.4507], [0.264, -0.4489],
    [0.2947, -0.4418], [0.3236, -0.43], [0.349, -0.41], [0.3738, -0.3887], [0.3993, -0.3687],
    [0.4241, -0.3474], [0.4442, -0.322], [0.4604, -0.295], [0.4741, -0.267], [0.4852, -0.2379],
    [0.4928, -0.2073], [0.4964, -0.1751], [0.4982, -0.1421], [0.4969, -0.109], [0.4928, -0.077],
    [0.4857, -0.0462], [0.4767, -0.0162], [0.465, 0.0126], [0.4513, 0.0406], [0.4351, 0.0676],
    [0.4176, 0.0941], [0.3988, 0.12], [0.3788, 0.1454], [0.3562, 0.1698], [0.3319, 0.1923],
    [0.3075, 0.2149], [0.2826, 0.2362], [0.2577, 0.2575], [0.2329, 0.2788], [0.208, 0.3001],
    [0.1831, 0.3214], [0.1577, 0.3414], [0.1323, 0.3614], [0.1069, 0.3815], [0.0809, 0.4002],
    [0.0548, 0.4185], [0.028, 0.4352], [0.0, 0.4489]
  ];

  function smooth(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function rightEdge(y) {
    const target = (y - CY) / WIDTH;
    let edge = 0;
    for (let i = 0; i < HALF.length - 1; i += 1) {
      const a = HALF[i];
      const b = HALF[i + 1];
      if (target < Math.min(a[1], b[1]) || target > Math.max(a[1], b[1])) continue;
      const span = b[1] - a[1];
      if (span === 0) continue;
      const ratio = (target - a[1]) / span;
      edge = Math.max(edge, a[0] + (b[0] - a[0]) * ratio);
    }
    return edge * WIDTH;
  }

  function makeHeartPath(theta) {
    const cosine = Math.cos(theta);
    const sine = Math.sin(theta);
    const side = cosine >= 0 ? 1 : -1;
    const points = HALF.map(([x, y]) => {
      const worldX = x * WIDTH;
      const z = WALL;
      return [CX + worldX * cosine + side * z * sine, CY + y * WIDTH];
    });
    HALF.slice().reverse().forEach(([x, y]) => {
      const worldX = -x * WIDTH;
      const z = WALL;
      points.push([CX + worldX * cosine + side * z * sine, CY + y * WIDTH]);
    });

    const path = new Path2D();
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) path.lineTo(points[i][0], points[i][1]);
    path.closePath();
    return path;
  }

  const measure = document.createElement("canvas").getContext("2d");
  measure.font = TEXT_PX + "px Arial, sans-serif";
  const widths = phrases.map((entry) => Math.max(8, measure.measureText(entry[1]).width));
  const rows = [[], []];

  function fitRow(left, right, first, rowIndex, pixelY, artSide) {
    const span = right - left;
    const picked = [];
    let used = 0;
    let index = first;

    for (let count = 0; count < 40; count += 1) {
      let chosen = -1;
      let width = 0;
      for (let tries = 0; tries < 12; tries += 1) {
        const candidate = (index + tries * 5) % phrases.length;
        const candidateWidth = widths[candidate];
        if (used + candidateWidth + (picked.length ? GAP : 0) <= span) {
          chosen = candidate;
          width = candidateWidth;
          break;
        }
      }
      if (chosen < 0) break;
      picked.push({ phraseIndex: chosen, width: width });
      used += width + (picked.length > 1 ? GAP : 0);
      index = chosen + 7;
    }
    if (!picked.length) return;

    const actualGap = picked.length > 1
      ? (span - picked.reduce((sum, item) => sum + item.width, 0)) / (picked.length - 1)
      : 0;
    let x = picked.length > 1 ? left : left + (span - picked[0].width) / 2;
    picked.forEach((item, itemIndex) => {
      const phrase = phrases[item.phraseIndex];
      const start = 0.1 + ((rowIndex * 7919 + itemIndex * 104729 + artSide * 31) % 997) / 997 * (BUILD - 0.6);
      rows[artSide].push({
        language: phrase[0],
        text: phrase[1],
        rtl: rtlLanguages.has(phrase[0]),
        x: x,
        y: pixelY,
        width: item.width,
        start: start
      });
      x += item.width + actualGap;
    });
  }

  let rowIndex = 0;
  for (let y = Math.floor(CY - 0.47 * WIDTH); y < CY + 0.46 * WIDTH; y += PITCH) {
    const upper = rightEdge(Math.max(0, y - TEXT_PX / 2));
    const lower = rightEdge(Math.min(H - 1, y + TEXT_PX / 2));
    const edge = Math.min(upper, lower);
    if (edge * 2 >= 40) {
      fitRow(CX - edge, CX + edge, rowIndex * 13 + Math.floor(edge), rowIndex, y, 0);
      fitRow(CX - edge, CX + edge, rowIndex * 13 + 29 + Math.floor(edge), rowIndex, y, 1);
      rowIndex += 1;
    }
  }

  const SKY = [255, 240, 248];
  const BAND = [78, 36, 70];
  const FLOOR = [246, 168, 210];

  function chrome(ry, rx) {
    const sky = smooth((ry - 0.12) / 0.3);
    const floor = smooth((-ry - 0.05) / 0.4);
    const band = 1 - sky - floor;
    const streak = Math.exp(-Math.pow((rx + 0.35) / 0.08, 2)) * smooth((ry + 0.1) / 0.3);
    return SKY.map((_, index) => Math.max(0, Math.min(255,
      BAND[index] * band + SKY[index] * sky + FLOOR[index] * floor + streak * 128
    )));
  }

  function render(seconds) {
    const theta = 2 * Math.PI * seconds / TURN;
    const cosine = Math.cos(theta);
    const sine = Math.sin(theta);
    const front = cosine >= 0;
    const side = front ? 1 : -1;
    const shape = makeHeartPath(theta);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.shadowColor = "rgba(255,159,199,.5)";
    ctx.shadowBlur = 34;
    ctx.strokeStyle = "rgba(255,159,199,.25)";
    ctx.lineWidth = 3;
    ctx.stroke(shape);
    ctx.restore();
    ctx.save();
    ctx.clip(shape);
    ctx.font = TEXT_PX + "px Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,159,199,.24)";
    ctx.shadowBlur = 7;

    const sortedRows = rows[front ? 0 : 1].slice().sort((a, b) => {
      const ax = a.x - CX;
      const bx = b.x - CX;
      const az = faceDepth(a.x, a.y, side);
      const bz = faceDepth(b.x, b.y, side);
      return (-ax * sine + az * cosine) - (-bx * sine + bz * cosine);
    });

    sortedRows.forEach((item) => {
      const reveal = smooth((seconds - item.start) / 0.3);
      if (reveal <= 0) return;

      const dx = item.x + item.width / 2 - CX;
      const normalizedY = (item.y - CY) / (0.45 * WIDTH);
      const extent = Math.max(1, rightEdge(item.y));
      const normalizedX = dx / extent;
      const radial = Math.max(Math.abs(normalizedX), Math.abs(normalizedY));
      const z = WALL + DOME * Math.sqrt(Math.max(0, 1 - radial * radial));
      const rotatedZ = side * z;
      const screenX = CX + dx * cosine + rotatedZ * sine;
      const screenY = item.y;
      const faceScale = Math.max(0.015, Math.abs(cosine));
      const normalX = normalizedX;
      const normalY = -normalizedY;
      const normalLength = Math.sqrt(normalX * normalX + normalY * normalY + 1);
      const nx = (normalX * cosine + side * sine) / normalLength;
      const nz = (-normalX * sine + side * cosine) / normalLength;
      const ry = 2 * nz * normalY / normalLength;
      const rx = 2 * nz * nx;
      const color = chrome(ry, rx);
      const rim = Math.max(0, Math.min(1, 1 - Math.abs(nz)));
      const brightness = (0.95 + 0.8 * rim) * Math.max(0.25, Math.abs(cosine) * 0.75 + 0.25);
      const alpha = Math.max(0.04, Math.min(1, brightness * faceScale));
      const r = Math.round(color[0] * brightness);
      const g = Math.round(color[1] * brightness);
      const b = Math.round(color[2] * brightness);
      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
      ctx.direction = item.rtl ? "rtl" : "ltr";

      const revealWidth = item.width * reveal;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(screenX, screenY);
      ctx.scale(faceScale, 1);
      ctx.beginPath();
      if (item.rtl) ctx.rect(item.width / 2 - revealWidth, -TEXT_PX, revealWidth, TEXT_PX * 2);
      else ctx.rect(-item.width / 2, -TEXT_PX, revealWidth, TEXT_PX * 2);
      ctx.clip();
      ctx.textAlign = "center";
      ctx.fillText(item.text, 0, 0, item.width);
      ctx.restore();
    });
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,240,248,.68)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255,159,199,.8)";
    ctx.shadowBlur = 16;
    ctx.stroke(shape);
    ctx.restore();
  }

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

  function faceDepth(x, y, side) {
    const extent = Math.max(1, rightEdge(y));
    const radial = Math.max(Math.abs((x - CX) / extent), Math.abs((y - CY) / (0.45 * WIDTH)));
    const z = WALL + DOME * Math.sqrt(Math.max(0, 1 - radial * radial));
    return side * z;
  }

  window.startOriginalHeart = function (onTurnComplete) {
    let startTime = null;
    let active = true;
    let frameId = 0;
    let visibilityChecked = false;
    function frame(now) {
      if (!active) return;
      if (startTime === null) startTime = now;
      const elapsed = Math.min((now - startTime) / 1000, TURN);
      try {
        render(elapsed);
        if (!visibilityChecked && elapsed >= BUILD) {
          visibilityChecked = true;
          const visible = canvasHasVisiblePixels();
          if (fallback) fallback.hidden = visible;
          if (!visible && window.reportIntroError) window.reportIntroError("I LOVE YOU canvas berjalan, tetapi tidak menghasilkan piksel yang terlihat.");
        }
      } catch (error) {
        console.error("I LOVE YOU canvas renderer failed:", error);
        if (window.reportIntroError) window.reportIntroError("I LOVE YOU: " + (error.stack || error.message || String(error)));
        if (fallback) fallback.hidden = false;
        active = false;
        onTurnComplete();
        return;
      }
      if (elapsed >= TURN) {
        active = false;
        onTurnComplete();
        return;
      }
      frameId = window.requestAnimationFrame(frame);
    }
    frameId = window.requestAnimationFrame(frame);
    return function stopOriginalHeart() {
      active = false;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  };
})();
