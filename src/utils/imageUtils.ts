import { FilterType, FrameId, Overlay, TemplateId, TextOverlay, ShapeOverlay } from '@/src/types';

// --- Filters ----------------------------------------------------------------
export const applyFilter = (
  imageData: ImageData,
  filter: FilterType
): ImageData => {
  const data = imageData.data;

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      break;

    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;

    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, r * 1.2);
        data[i + 1] = Math.min(255, g * 1.1);
        data[i + 2] = Math.min(255, b * 0.8);
      }
      break;

    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 30);
        data[i + 2] = Math.max(0, data[i + 2] - 20);
      }
      break;

    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] - 20);
        data[i + 2] = Math.min(255, data[i + 2] + 30);
      }
      break;

    case 'bright':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 40);
        data[i + 1] = Math.min(255, data[i + 1] + 40);
        data[i + 2] = Math.min(255, data[i + 2] + 40);
      }
      break;

    case 'contrast': {
      const factor = 1.5;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
      }
      break;
    }

    case 'none':
    default:
      break;
  }

  return imageData;
};

// --- Helpers ----------------------------------------------------------------
export const applyFilterToImage = (
  imageSrc: string,
  filter: FilterType
): Promise<string> => {
  return new Promise((resolve) => {
    if (filter === 'none') {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const filteredData = applyFilter(imageData, filter);
      ctx.putImageData(filteredData, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageSrc);
  });
};

// --- Frames ---------------------------------------------------------------
function drawFrameInRect(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  frame: FrameId
) {
  if (frame === 'none') return;
  // Common helpers
  const roundRect = (x: number, y: number, width: number, height: number, r: number) => {
    const radius = Math.min(r, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };

  switch (frame) {
    case 'polaroid': {
      // White border with thicker bottom strip
      const t = Math.max(8, Math.floor(Math.min(w, h) * 0.02));
      const b = t * 3; // bottom thicker
      // Semi-transparent white overlay at edges to suggest a frame
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      // top
      ctx.fillRect(x0, y0, w, t);
      // bottom
      ctx.fillRect(x0, y0 + h - b, w, b);
      // left
      ctx.fillRect(x0, y0, t, h);
      // right
      ctx.fillRect(x0 + w - t, y0, t, h);
      // subtle caption line
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.font = `${Math.max(12, Math.floor(b / 3))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('PhotoBooth', x0 + w / 2, y0 + h - Math.floor(b / 2));
      ctx.restore();
      break;
    }
    case 'film': {
      // Black bars with perforations (holes) down the sides
      const bar = Math.max(10, Math.floor(Math.min(w, h) * 0.03));
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(x0, y0, bar, h);
      ctx.fillRect(x0 + w - bar, y0, bar, h);
      // holes
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const holeR = Math.max(3, Math.floor(bar * 0.25));
      const spacing = holeR * 3;
      for (let y = y0 + holeR * 2; y < y0 + h - holeR * 2; y += spacing) {
        // left column
        ctx.beginPath();
        ctx.arc(x0 + Math.floor(bar / 2), y, holeR, 0, Math.PI * 2);
        ctx.fill();
        // right column
        ctx.beginPath();
        ctx.arc(x0 + w - Math.floor(bar / 2), y, holeR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'neon': {
      // Neon glow rounded stroke
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.03));
      ctx.save();
      ctx.lineWidth = Math.max(3, Math.floor(pad * 0.4));
      ctx.strokeStyle = '#7c3aed'; // purple
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = Math.max(10, pad);
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'gold': {
      // Gold gradient stroke
      const pad = Math.max(8, Math.floor(Math.min(w, h) * 0.025));
      const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      grad.addColorStop(0, '#c59d5f');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1, '#c59d5f');
      ctx.save();
      ctx.lineWidth = Math.max(6, Math.floor(pad * 0.7));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.6));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'tape': {
      // Masking tape rectangles at 4 corners
      const tapeW = Math.max(40, Math.floor(Math.min(w, h) * 0.12));
      const tapeH = Math.max(14, Math.floor(tapeW * 0.35));
      const pad = Math.max(8, Math.floor(Math.min(w, h) * 0.025));
      ctx.save();
      ctx.fillStyle = 'rgba(255, 247, 209, 0.9)'; // creamy tape
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      const drawTape = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
        ctx.strokeRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
        ctx.restore();
      };
      drawTape(x0 + pad + tapeW / 2, y0 + pad + tapeH / 2, -10);
      drawTape(x0 + w - pad - tapeW / 2, y0 + pad + tapeH / 2, 8);
      drawTape(x0 + pad + tapeW / 2, y0 + h - pad - tapeH / 2, 12);
      drawTape(x0 + w - pad - tapeW / 2, y0 + h - pad - tapeH / 2, -7);
      ctx.restore();
      break;
    }
    case 'christmas': {
      // Red-green gradient stroke and snow dots
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.03));
      const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(1, '#22c55e');
      ctx.save();
      ctx.lineWidth = Math.max(8, Math.floor(pad * 0.7));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.6));
      ctx.stroke();
      // snow dots along edges
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 40; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.5 || rx > x0 + w - pad * 1.5 || ry < y0 + pad * 1.5 || ry > y0 + h - pad * 1.5) {
          const r = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'tet': {
      // Red border with golden thin stroke and corner dots
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.03));
      ctx.save();
      // outer red stroke
      ctx.lineWidth = Math.max(10, Math.floor(pad * 0.8));
      ctx.strokeStyle = '#dc2626';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.4));
      ctx.stroke();
      // inner golden stroke
      ctx.lineWidth = Math.max(3, Math.floor(pad * 0.25));
      ctx.strokeStyle = '#f59e0b';
      roundRect(x0 + pad * 1.8, y0 + pad * 1.8, w - pad * 3.6, h - pad * 3.6, Math.floor(pad * 0.3));
      ctx.stroke();
      // corner dots
      ctx.fillStyle = '#f59e0b';
      const d = Math.max(5, Math.floor(pad * 0.5));
      const points: Array<[number, number]> = [
        [x0 + pad * 1.2, y0 + pad * 1.2],
        [x0 + w - pad * 1.2, y0 + pad * 1.2],
        [x0 + pad * 1.2, y0 + h - pad * 1.2],
        [x0 + w - pad * 1.2, y0 + h - pad * 1.2],
      ];
      points.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, d, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      break;
    }
    case 'birthday': {
      // Confetti dots around edges with thin colored stroke
      const pad = Math.max(8, Math.floor(Math.min(w, h) * 0.025));
      ctx.save();
      ctx.lineWidth = Math.max(4, Math.floor(pad * 0.5));
      ctx.strokeStyle = '#9333ea';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.6));
      ctx.stroke();
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#eab308', '#a855f7'];
      for (let i = 0; i < 60; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.2 || rx > x0 + w - pad * 1.2 || ry < y0 + pad * 1.2 || ry > y0 + h - pad * 1.2) {
          const r = Math.random() * 3 + 1.5;
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'wedding': {
      // Soft white vignette and thin gold stroke
      const pad = Math.max(8, Math.floor(Math.min(w, h) * 0.025));
      ctx.save();
      // vignette: draw translucent white around edges
      const grd = ctx.createRadialGradient(x0 + w / 2, y0 + h / 2, Math.min(w, h) / 4, x0 + w / 2, y0 + h / 2, Math.max(w, h) / 1.2);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = grd as unknown as string;
      roundRect(x0, y0, w, h, Math.floor(pad * 0.4));
      ctx.fill();
      // gold thin stroke
      const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      grad.addColorStop(0, '#c59d5f');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1, '#c59d5f');
      ctx.lineWidth = Math.max(3, Math.floor(pad * 0.4));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.5));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'pastel-1': {
      // Soft rainbow perimeter + small stars/hearts at edges
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      grad.addColorStop(0, '#fbcfe8'); // pink-200
      grad.addColorStop(0.33, '#fde68a'); // yellow-300
      grad.addColorStop(0.66, '#bfdbfe'); // blue-200
      grad.addColorStop(1, '#ddd6fe'); // violet-200
      ctx.save();
      ctx.lineWidth = Math.max(8, Math.floor(pad * 0.7));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      // doodles
      const dots = 30;
      for (let i = 0; i < dots; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.4 || rx > x0 + w - pad * 1.4 || ry < y0 + pad * 1.4 || ry > y0 + h - pad * 1.4) {
          ctx.fillStyle = ['#f472b6', '#60a5fa', '#f59e0b', '#a78bfa'][i % 4];
          const r = Math.random() * 2 + 1.5;
          ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'pastel-2': {
      // Peach to pink rounded panel with corner accents
      const pad = Math.max(12, Math.floor(Math.min(w, h) * 0.04));
      ctx.save();
      const g = ctx.createLinearGradient(x0, y0, x0, y0 + h);
      g.addColorStop(0, 'rgba(255, 237, 213, 0.6)'); // orange-100
      g.addColorStop(1, 'rgba(254, 215, 170, 0.6)'); // orange-200
      ctx.lineWidth = Math.max(10, Math.floor(pad * 0.8));
      ctx.strokeStyle = '#fb7185';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad));
      ctx.stroke();
      ctx.fillStyle = g as unknown as string;
      roundRect(x0 + pad * 1.2, y0 + pad * 1.2, w - pad * 2.4, h - pad * 2.4, Math.floor(pad * 0.9));
      ctx.fill();
      // corner petals
      ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
      const size = Math.max(10, Math.floor(pad * 0.9));
      ctx.beginPath(); ctx.arc(x0 + pad * 1.4, y0 + pad * 1.4, size, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + w - pad * 1.4, y0 + pad * 1.4, size, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + pad * 1.4, y0 + h - pad * 1.4, size, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + w - pad * 1.4, y0 + h - pad * 1.4, size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'ocean': {
      // Blue-teal stroke with wave pattern on bottom
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      const grad = ctx.createLinearGradient(x0, y0, x0, y0 + h);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(1, '#14b8a6');
      ctx.lineWidth = Math.max(8, Math.floor(pad * 0.7));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.7));
      ctx.stroke();
      // waves
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      const by = y0 + h - pad * 1.3;
      ctx.beginPath();
      for (let x = x0 + pad; x <= x0 + w - pad; x += 12) {
        const y = by + Math.sin((x / 12) * Math.PI / 2) * 4;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'school': {
      // Lined-paper inner border + tape corners
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      // light paper background strip
      ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.5));
      ctx.fill();
      // blue lines
      ctx.strokeStyle = 'rgba(59,130,246,0.35)';
      ctx.lineWidth = 1;
      for (let yy = y0 + pad * 1.2; yy < y0 + h - pad * 1.2; yy += 12) {
        ctx.beginPath(); ctx.moveTo(x0 + pad * 1.2, yy); ctx.lineTo(x0 + w - pad * 1.2, yy); ctx.stroke();
      }
      // red margin line
      ctx.strokeStyle = 'rgba(248,113,113,0.5)';
      ctx.beginPath(); ctx.moveTo(x0 + pad * 1.8, y0 + pad * 1.2); ctx.lineTo(x0 + pad * 1.8, y0 + h - pad * 1.2); ctx.stroke();
      // outer border
      ctx.lineWidth = Math.max(6, Math.floor(pad * 0.5));
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      roundRect(x0 + pad * 0.8, y0 + pad * 0.8, w - pad * 1.6, h - pad * 1.6, Math.floor(pad * 0.4));
      ctx.stroke();
      // tapes
      const tape = (tx: number, ty: number, rot: number) => {
        ctx.save(); ctx.translate(tx, ty); ctx.rotate((rot * Math.PI)/180);
        ctx.fillStyle = 'rgba(254,252,191,0.9)';
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(-30, -7, 60, 14); ctx.strokeRect(-30, -7, 60, 14);
        ctx.restore();
      };
      tape(x0 + pad * 1.2, y0 + pad * 1.2, -12);
      tape(x0 + w - pad * 1.2, y0 + pad * 1.2, 10);
      tape(x0 + pad * 1.2, y0 + h - pad * 1.2, 8);
      tape(x0 + w - pad * 1.2, y0 + h - pad * 1.2, -10);
      ctx.restore();
      break;
    }
    case 'bubble': {
      // Pink bubbles around the edges
      const pad = Math.max(8, Math.floor(Math.min(w, h) * 0.03));
      ctx.save();
      const bubbles = 28;
      for (let i = 0; i < bubbles; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.2 || rx > x0 + w - pad * 1.2 || ry < y0 + pad * 1.2 || ry > y0 + h - pad * 1.2) {
          const r = Math.random() * 10 + 6;
          const grad = ctx.createRadialGradient(rx - r/3, ry - r/3, 2, rx, ry, r);
          grad.addColorStop(0, 'rgba(255,255,255,0.9)');
          grad.addColorStop(1, 'rgba(244,114,182,0.45)');
          ctx.fillStyle = grad as unknown as string;
          ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      // thin stroke
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(244,114,182,0.6)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.7));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'sticker': {
      // Scatter emojis/icons around edges
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(99,102,241,0.6)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      const stickers = ['✨','💜','🌈','📸','⭐','🎀','🍓','🦄','🌸','🎈'];
      ctx.font = `${Math.max(16, Math.floor(pad))}px serif`;
      for (let i = 0; i < 18; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.3 || rx > x0 + w - pad * 1.3 || ry < y0 + pad * 1.3 || ry > y0 + h - pad * 1.3) {
          const e = stickers[i % stickers.length];
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(((Math.random() - 0.5) * 20 * Math.PI) / 180);
          ctx.fillText(e, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
      break;
    }
    case 'comic': {
      // Halftone dots + pop starbursts in corners
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      // halftone
      for (let yy = y0 + pad; yy < y0 + h - pad; yy += 10) {
        for (let xx = x0 + pad; xx < x0 + w - pad; xx += 10) {
          const edge = xx < x0 + pad * 1.2 || xx > x0 + w - pad * 1.2 || yy < y0 + pad * 1.2 || yy > y0 + h - pad * 1.2;
          if (edge) {
            const r = 1 + (Math.sin(xx * 0.1) + Math.cos(yy * 0.1)) * 0.5 + 1;
            ctx.fillStyle = 'rgba(59,130,246,0.35)';
            ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      // starburst function
      const star = (cx: number, cy: number, spikes: number, outerR: number, innerR: number, color: string) => {
        let rot = Math.PI / 2 * 3;
        let x = cx, y = cy;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerR; y = cy + Math.sin(rot) * outerR; ctx.lineTo(x, y); rot += Math.PI / spikes;
          x = cx + Math.cos(rot) * innerR; y = cy + Math.sin(rot) * innerR; ctx.lineTo(x, y); rot += Math.PI / spikes;
        }
        ctx.lineTo(cx, cy - outerR); ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
      };
      star(x0 + pad * 2, y0 + pad * 2, 7, 14, 6, 'rgba(249,115,22,0.7)');
      star(x0 + w - pad * 2, y0 + h - pad * 2, 7, 16, 7, 'rgba(168,85,247,0.7)');
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,23,42,0.5)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.5));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'flower': {
      // Soft green stroke + flower petals at corners
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      ctx.lineWidth = Math.max(8, Math.floor(pad * 0.6));
      ctx.strokeStyle = 'rgba(16,185,129,0.6)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.7));
      ctx.stroke();
      const petal = (cx: number, cy: number, r: number, color: string) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(cx + Math.cos(ang) * r * 0.6, cy + Math.sin(ang) * r * 0.6, r * 0.45, r * 0.2, ang, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2); ctx.fill();
      };
      petal(x0 + pad * 1.5, y0 + pad * 1.5, Math.floor(pad * 0.9), '#f9a8d4');
      petal(x0 + w - pad * 1.5, y0 + pad * 1.5, Math.floor(pad * 0.9), '#93c5fd');
      petal(x0 + pad * 1.5, y0 + h - pad * 1.5, Math.floor(pad * 0.9), '#86efac');
      petal(x0 + w - pad * 1.5, y0 + h - pad * 1.5, Math.floor(pad * 0.9), '#fcd34d');
      ctx.restore();
      break;
    }
    case 'hearts': {
      // Scatter pink hearts around edges + thin pink stroke
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      ctx.lineWidth = 5; ctx.strokeStyle = '#ec4899';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      const drawHeart = (cx: number, cy: number, size: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy + size / 4);
        ctx.bezierCurveTo(cx + size / 2, cy - size / 2, cx + size, cy + size / 3, cx, cy + size);
        ctx.bezierCurveTo(cx - size, cy + size / 3, cx - size / 2, cy - size / 2, cx, cy + size / 4);
        ctx.fill();
      };
      for (let i = 0; i < 22; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        const edge = rx < x0 + pad * 1.3 || rx > x0 + w - pad * 1.3 || ry < y0 + pad * 1.3 || ry > y0 + h - pad * 1.3;
        if (edge) drawHeart(rx, ry, Math.random() * 10 + 6, 'rgba(236,72,153,0.75)');
      }
      ctx.restore();
      break;
    }
    case 'sparkle': {
      // Glitter-like sparkles + gradient pink border
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(1, '#fb7185');
      ctx.save();
      ctx.lineWidth = Math.max(6, Math.floor(pad * 0.6));
      ctx.strokeStyle = grad as unknown as string;
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      // sparkles
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const star = (cx: number, cy: number, r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5; ctx.stroke();
      };
      for (let i = 0; i < 30; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        if (rx < x0 + pad * 1.2 || rx > x0 + w - pad * 1.2 || ry < y0 + pad * 1.2 || ry > y0 + h - pad * 1.2) star(rx, ry, 6 + (i % 3));
      }
      ctx.restore();
      break;
    }
    case 'ribbon': {
      // Pink ribbon corners + soft rounded stroke
      const pad = Math.max(12, Math.floor(Math.min(w, h) * 0.04));
      ctx.save();
      ctx.lineWidth = Math.max(8, Math.floor(pad * 0.6));
      ctx.strokeStyle = 'rgba(244,114,182,0.8)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad));
      ctx.stroke();
      const ribbon = (cx: number, cy: number, rot: number) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate((rot * Math.PI)/180);
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(34,14); ctx.lineTo(24,0); ctx.lineTo(34,-14); ctx.closePath(); ctx.fill();
        ctx.restore();
      };
      ribbon(x0 + pad * 1.2, y0 + pad * 1.2, -30);
      ribbon(x0 + w - pad * 1.2, y0 + pad * 1.2, 30);
      ribbon(x0 + pad * 1.2, y0 + h - pad * 1.2, -150);
      ribbon(x0 + w - pad * 1.2, y0 + h - pad * 1.2, 150);
      ctx.restore();
      break;
    }
    case 'candy': {
      // Candy cane stripes around border
      const pad = Math.max(12, Math.floor(Math.min(w, h) * 0.05));
      ctx.save();
      // Outer white stroke
      ctx.lineWidth = Math.max(12, Math.floor(pad * 0.9));
      ctx.strokeStyle = '#fff';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      // Diagonal pink stripes
      ctx.save();
      ctx.beginPath(); roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8)); ctx.clip();
      ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 10;
      const step = 18;
      for (let dx = -w; dx < w; dx += step) {
        ctx.beginPath();
        ctx.moveTo(x0 + dx, y0 - 20);
        ctx.lineTo(x0 + dx + h + w, y0 + h + 20);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
      break;
    }
    case 'blossom': {
      // Falling petals + thin pink stroke
      const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.035));
      ctx.save();
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(236,72,153,0.7)';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 0.8));
      ctx.stroke();
      ctx.fillStyle = 'rgba(244,114,182,0.6)';
      for (let i = 0; i < 26; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        const edge = rx < x0 + pad * 1.2 || rx > x0 + w - pad * 1.2 || ry < y0 + pad * 1.2 || ry > y0 + h - pad * 1.2;
        if (!edge) continue;
        const ang = Math.random() * Math.PI;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang);
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      break;
    }
    case 'kawaii': {
      // Thick rounded hot-pink border and scattered cute emojis
      const pad = Math.max(14, Math.floor(Math.min(w, h) * 0.06));
      ctx.save();
      ctx.lineWidth = Math.max(14, Math.floor(pad));
      ctx.strokeStyle = '#f43f5e';
      roundRect(x0 + pad, y0 + pad, w - pad * 2, h - pad * 2, Math.floor(pad * 1.1));
      ctx.stroke();
      ctx.font = `${Math.max(18, Math.floor(pad * 0.9))}px serif`;
      const icons = ['🩷','✨','🍑','🐰','🌸','🎀'];
      for (let i = 0; i < 16; i++) {
        const rx = x0 + Math.random() * w;
        const ry = y0 + Math.random() * h;
        const edge = rx < x0 + pad * 1.2 || rx > x0 + w - pad * 1.2 || ry < y0 + pad * 1.2 || ry > y0 + h - pad * 1.2;
        if (edge) ctx.fillText(icons[i % icons.length], rx, ry);
      }
      ctx.restore();
      break;
    }
  }
}

export const applyFilterAndFrameToImage = (
  imageSrc: string,
  filter: FilterType,
  frame: FrameId
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      // draw image first
      ctx.drawImage(img, 0, 0);

      // apply filter pixels
      if (filter !== 'none') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const filteredData = applyFilter(imageData, filter);
        ctx.putImageData(filteredData, 0, 0);
      }

  // draw frame overlay
  drawFrameInRect(ctx, 0, 0, canvas.width, canvas.height, frame);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageSrc);
  });
};

// --- Overlays ---------------------------------------------------------------
function drawOverlays(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  overlays: Overlay[]
) {
  overlays.forEach((ov) => {
    const x = ov.x * canvasW;
    const y = ov.y * canvasH;
    const rot = ((ov.rotation ?? 0) * Math.PI) / 180;
    const opacity = ov.opacity ?? 1;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(rot);

    if ((ov as unknown as { type: string }).type === 'text') {
      const t = ov as TextOverlay;
      const fontPx = Math.max(10, t.fontSize);
      const weight = t.bold ? 'bold' : 'normal';
      const family = t.fontFamily || 'sans-serif';
      ctx.font = `${weight} ${fontPx}px ${family}`;
      ctx.textAlign = t.align || 'center';
      ctx.textBaseline = 'middle';

      // shadow
      if (t.shadowColor && (t.shadowBlur ?? 0) > 0) {
        ctx.shadowColor = t.shadowColor;
        ctx.shadowBlur = t.shadowBlur ?? 0;
      } else {
        ctx.shadowBlur = 0;
      }

      if (t.outlineColor && (t.outlineWidth ?? 0) > 0) {
        ctx.strokeStyle = t.outlineColor;
        ctx.lineWidth = t.outlineWidth ?? 0;
        ctx.strokeText(t.text, 0, 0);
      }
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
    } else {
      const s = ov as ShapeOverlay;
      const size = Math.max(4, s.size);
      const drawHeart = (r: number) => {
        ctx.beginPath();
        ctx.moveTo(0, r * 0.3);
        ctx.bezierCurveTo(r * 0.5, -r * 0.6, r, r * 0.2, 0, r);
        ctx.bezierCurveTo(-r, r * 0.2, -r * 0.5, -r * 0.6, 0, r * 0.3);
        ctx.closePath();
      };
      const drawStar = (r: number) => {
        const spikes = 5;
        let rot2 = Math.PI / 2 * 3;
        let x2 = 0, y2 = 0;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        for (let i = 0; i < spikes; i++) {
          x2 = Math.cos(rot2) * r; y2 = Math.sin(rot2) * r; ctx.lineTo(x2, y2); rot2 += Math.PI / spikes;
          x2 = Math.cos(rot2) * (r * 0.5); y2 = Math.sin(rot2) * (r * 0.5); ctx.lineTo(x2, y2); rot2 += Math.PI / spikes;
        }
        ctx.closePath();
      };
      const drawSparkle = (r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      };

      // fill/stroke
      ctx.fillStyle = s.fill;
      if (s.stroke) {
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.strokeWidth ?? 2;
      }

      switch (s.shape) {
        case 'heart':
          drawHeart(size);
          ctx.fill();
          if (s.stroke) ctx.stroke();
          break;
        case 'star':
          drawStar(size);
          ctx.fill();
          if (s.stroke) ctx.stroke();
          break;
        case 'sparkle':
          drawSparkle(size);
          if (s.stroke) ctx.stroke();
          else {
            ctx.strokeStyle = s.fill;
            ctx.lineWidth = s.strokeWidth ?? 2;
            ctx.stroke();
          }
          break;
      }
    }

    ctx.restore();
  });
}

export const applyFilterFrameAndOverlaysToImage = (
  imageSrc: string,
  filter: FilterType,
  frame: FrameId,
  overlays?: Overlay[]
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);

      if (filter !== 'none') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const filteredData = applyFilter(imageData, filter);
        ctx.putImageData(filteredData, 0, 0);
      }

      drawFrameInRect(ctx, 0, 0, canvas.width, canvas.height, frame);

      if (overlays && overlays.length) {
        drawOverlays(ctx, canvas.width, canvas.height, overlays);
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageSrc);
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Collage generator -----------------------------------------------------
export const createCollage = (
  images: string[],
  layout: { rows: number; cols: number },
  options?: {
    cellWidth?: number;
    cellHeight?: number;
    padding?: number;
    bgColor?: string;
    cornerRadius?: number;
    style?: 'classic' | 'polaroid' | 'emoji' | 'modern';
    emojis?: string[];
    overlayUrl?: string | null;
    mask?: 'none' | 'rounded' | 'circle' | 'oval';
    vertical?: boolean; // when true, produce a vertical photobooth strip (1 column, stacked rows)
    frame?: FrameId; // optional frame for each cell
    // New options
    overlays?: Overlay[]; // page-level overlays
    templateId?: TemplateId;
    title?: string; // optional title banner
  }
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const cellWidth = options?.cellWidth ?? 400;
    const cellHeight = options?.cellHeight ?? 300;
    const padding = options?.padding ?? 8;
    const bgColor = options?.bgColor ?? '#ffffff';
    const cornerRadius = options?.cornerRadius ?? 16;
    const style = options?.style ?? 'classic';
    const emojis = options?.emojis ?? ['✨', '📸', '💜', '🌈', '🎉'];
    const overlayUrl = options?.overlayUrl ?? null;
  const mask = options?.mask ?? 'rounded';

    canvas.width = cellWidth * layout.cols;
    canvas.height = cellHeight * layout.rows;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    const Ctx = ctx as CanvasRenderingContext2D;

    // Background
    Ctx.fillStyle = bgColor;
    Ctx.fillRect(0, 0, canvas.width, canvas.height);

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      const radius = Math.min(r, w / 2, h / 2);
      Ctx.beginPath();
      Ctx.moveTo(x + radius, y);
      Ctx.arcTo(x + w, y, x + w, y + h, radius);
      Ctx.arcTo(x + w, y + h, x, y + h, radius);
      Ctx.arcTo(x, y + h, x, y, radius);
      Ctx.arcTo(x, y, x + w, y, radius);
      Ctx.closePath();
    }

    const vertical = options?.vertical ?? false;

    // if vertical is requested, force a single-column stacked layout
    const cols = vertical ? 1 : layout.cols;
    const rows = vertical ? Math.max(1, images.length) : layout.rows;

    let loadedImages = 0;
    const totalSlots = cols * rows;
    const imagesToLoad = Math.min(images.length, totalSlots);

    if (imagesToLoad === 0) {
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    // adjust canvas size for vertical mode or given layout
    canvas.width = cellWidth * cols;
    canvas.height = cellHeight * rows;

    images.slice(0, totalSlots).forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;

      img.onload = () => {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const x = col * cellWidth;
  const y = row * cellHeight;

        // cell background (separator)
        Ctx.fillStyle = style === 'polaroid' ? '#ffffff' : '#f7f7f7';
        const innerX = x + padding;
        const innerY = y + padding;
        const innerW = cellWidth - padding * 2;
        const innerH = cellHeight - padding * 2;

        // draw rounded background for the image
        roundRect(innerX, innerY, innerW, innerH, cornerRadius);
        Ctx.fill();

        // clip to desired mask and draw image covering the area
        Ctx.save();
        if (mask === 'circle') {
          const cx = innerX + innerW / 2;
          const cy = innerY + innerH / 2;
          const radius = Math.min(innerW, innerH) / 2;
          Ctx.beginPath();
          Ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          Ctx.closePath();
        } else if (mask === 'oval') {
          const cx = innerX + innerW / 2;
          const cy = innerY + innerH / 2;
          const rx = innerW / 2;
          const ry = innerH / 2;
          Ctx.beginPath();
          Ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          Ctx.closePath();
        } else if (mask === 'rounded') {
          roundRect(innerX, innerY, innerW, innerH, cornerRadius);
        } else {
          Ctx.beginPath();
          Ctx.rect(innerX, innerY, innerW, innerH);
          Ctx.closePath();
        }
        Ctx.clip();

        // cover mode: fit and cover
        const ratio = Math.max(innerW / img.width, innerH / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        const dx = innerX - (drawW - innerW) / 2;
        const dy = innerY - (drawH - innerH) / 2;
        Ctx.drawImage(img, dx, dy, drawW, drawH);
        Ctx.restore();

        // optional per-cell frame overlay
        const frame = options?.frame ?? 'none';
        if (frame && frame !== 'none') {
          drawFrameInRect(Ctx, innerX, innerY, innerW, innerH, frame);
        }

        // optional polaroid effect: white bottom strip and small caption
        if (style === 'polaroid') {
          const stripH = Math.round(innerH * 0.14);
          Ctx.fillStyle = '#fff';
          Ctx.fillRect(innerX, innerY + innerH - stripH, innerW, stripH);
          Ctx.fillStyle = '#666';
          Ctx.font = `${Math.max(12, stripH / 3)}px sans-serif`;
          Ctx.textAlign = 'center';
          Ctx.fillText('Photo', innerX + innerW / 2, innerY + innerH - stripH / 2 + 6);
        }

        // decorations: emoji/icon
        if (style === 'emoji') {
          const emoji = emojis[index % emojis.length] || '✨';
          Ctx.font = `${Math.round(Math.min(innerW, innerH) / 6)}px serif`;
          Ctx.textAlign = 'right';
          Ctx.fillText(emoji, innerX + innerW - 8, innerY + 24);
        }

        // subtle frame for each photo
        Ctx.lineWidth = 2;
        Ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        if (mask === 'circle') {
          const cx = innerX + innerW / 2;
          const cy = innerY + innerH / 2;
          const radius = Math.min(innerW, innerH) / 2;
          Ctx.beginPath();
          Ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          Ctx.closePath();
        } else if (mask === 'oval') {
          const cx = innerX + innerW / 2;
          const cy = innerY + innerH / 2;
          const rx = innerW / 2;
          const ry = innerH / 2;
          Ctx.beginPath();
          Ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          Ctx.closePath();
        } else {
          roundRect(innerX, innerY, innerW, innerH, cornerRadius);
        }
        Ctx.stroke();

        loadedImages++;
        if (loadedImages === imagesToLoad) {
          // if overlay provided, load it and draw over whole canvas
          if (overlayUrl) {
            const ov = new Image();
            ov.crossOrigin = 'anonymous';
            ov.src = overlayUrl;
            ov.onload = () => {
              Ctx.drawImage(ov, 0, 0, canvas.width, canvas.height);
              finalize();
            };
            ov.onerror = () => finalize();
          } else {
            finalize();
          }
        }
      };

      img.onerror = () => {
        loadedImages++;
        if (loadedImages === imagesToLoad) {
          resolve(canvas.toDataURL('image/png'));
        }
      };
    });

    // helper to finalize export when overlay not present or after overlay drawn
    function finalize() {
      // Template decorations
      const templateId: TemplateId | undefined = options?.templateId;
      if (templateId === 'dual-strip-pink') {
        // Soft pink gradient background already filled; draw center divider and footer
        Ctx.save();
        // central divider
        Ctx.fillStyle = 'rgba(244,114,182,0.35)';
        Ctx.fillRect(canvas.width / 2 - 4, 0, 8, canvas.height);
        // outer border
        Ctx.lineWidth = 12; Ctx.strokeStyle = 'rgba(244,114,182,0.6)';
        Ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
        // footer banner
        const bannerH = Math.min(80, Math.max(40, Math.round(canvas.height * 0.08)));
        Ctx.fillStyle = 'rgba(255,255,255,0.85)';
        Ctx.fillRect(0, canvas.height - bannerH, canvas.width, bannerH);
        Ctx.fillStyle = '#db2777';
        Ctx.font = `bold ${Math.round(bannerH * 0.5)}px sans-serif`;
        Ctx.textAlign = 'center';
        Ctx.fillText(options?.title || 'PhotoBooth', canvas.width / 2, canvas.height - bannerH / 2 + 8);
        Ctx.restore();
      } else if (templateId === 'curved-pastel-board') {
        Ctx.save();
        // rounded colored panel
        const pad = Math.round(Math.min(canvas.width, canvas.height) * 0.04);
        const r = Math.round(pad * 1.2);
        Ctx.fillStyle = 'rgba(255, 228, 230, 0.6)';
        Ctx.strokeStyle = 'rgba(244,114,182,0.7)';
        Ctx.lineWidth = 8;
        Ctx.beginPath();
        Ctx.moveTo(pad + r, pad);
        Ctx.arcTo(canvas.width - pad, pad, canvas.width - pad, canvas.height - pad, r);
        Ctx.arcTo(canvas.width - pad, canvas.height - pad, pad, canvas.height - pad, r);
        Ctx.arcTo(pad, canvas.height - pad, pad, pad, r);
        Ctx.arcTo(pad, pad, canvas.width - pad, pad, r);
        Ctx.closePath();
        Ctx.fill();
        Ctx.stroke();
        // title ribbon
        const ribbonH = Math.min(90, Math.max(48, Math.round(canvas.height * 0.1)));
        const ribbonY = pad + ribbonH;
        Ctx.fillStyle = '#f472b6';
        Ctx.beginPath();
        Ctx.moveTo(pad * 2, ribbonY - ribbonH);
        Ctx.quadraticCurveTo(canvas.width / 2, ribbonY, canvas.width - pad * 2, ribbonY - ribbonH);
        Ctx.lineTo(canvas.width - pad * 2, ribbonY);
        Ctx.quadraticCurveTo(canvas.width / 2, ribbonY + ribbonH / 2, pad * 2, ribbonY);
        Ctx.closePath();
        Ctx.fill();
        Ctx.fillStyle = '#fff';
        Ctx.font = `bold ${Math.round(ribbonH * 0.4)}px sans-serif`;
        Ctx.textAlign = 'center';
        Ctx.fillText(options?.title || 'Besties', canvas.width / 2, ribbonY - ribbonH / 5);
        Ctx.restore();
      } else if (templateId === 'sticker-sheet') {
        Ctx.save();
        const dots = 40;
        for (let i = 0; i < dots; i++) {
          Ctx.fillStyle = ['#fda4af','#fef3c7','#bfdbfe','#ddd6fe'][i % 4];
          const r = 6 + (i % 3) * 2;
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          Ctx.beginPath(); Ctx.arc(x, y, r, 0, Math.PI * 2); Ctx.fill();
        }
        Ctx.restore();
      }

      // Page-level overlays
      if (options?.overlays && options.overlays.length) {
        drawOverlays(Ctx, canvas.width, canvas.height, options.overlays);
      }

      if (style === 'modern') {
        Ctx.font = '48px serif';
        Ctx.fillStyle = 'rgba(255,255,255,0.9)';
        Ctx.textAlign = 'center';
        Ctx.fillText('✨ Collage ✨', canvas.width / 2, 60);
      }
      resolve(canvas.toDataURL('image/png'));
    }
  });
};
