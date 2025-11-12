import { FilterType, FrameId } from '@/src/types';

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
    mask?: 'none' | 'rounded' | 'circle';
    vertical?: boolean; // when true, produce a vertical photobooth strip (1 column, stacked rows)
    frame?: FrameId; // optional frame for each cell
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
