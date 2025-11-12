"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Overlay, TextOverlay, ShapeOverlay } from '@/src/types';

interface OverlayEditorProps {
  overlays: Overlay[];
  onChange: (overlays: Overlay[]) => void;
  title?: string;
}

export default function OverlayEditor({ overlays, onChange, title = 'Overlay Editor' }: OverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selected = useMemo(() => overlays.find(o => o.id === selectedId) || null, [overlays, selectedId]);

  // Drag handling
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    setSelectedId(id);
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !selected) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const idx = overlays.findIndex(o => o.id === selected.id);
    if (idx >= 0) {
      const copy = overlays.slice();
      copy[idx] = { ...copy[idx], x: nx, y: ny } as Overlay;
      onChange(copy);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  };

  const addText = () => {
    const id = `txt-${Date.now()}`;
    const t: TextOverlay = {
      id,
      type: 'text',
      text: 'Your text',
      x: 0.5,
      y: 0.85,
      fontSize: 36,
      color: '#ffffff',
      bold: true,
      align: 'center',
      outlineColor: '#000000',
      outlineWidth: 4,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowBlur: 8,
    };
    onChange([...(overlays || []), t]);
    setSelectedId(id);
  };

  const addShape = (shape: ShapeOverlay['shape']) => {
    const id = `shp-${Date.now()}-${shape}`;
    const s: ShapeOverlay = {
      id,
      type: 'shape',
      shape,
      x: 0.1 + Math.random() * 0.8,
      y: 0.15 + Math.random() * 0.7,
      size: 28,
      fill: shape === 'sparkle' ? '#ffffff' : '#f472b6',
      stroke: shape === 'sparkle' ? '#ffffff' : '#be185d',
      strokeWidth: 2,
      opacity: 1,
    };
    onChange([...(overlays || []), s]);
    setSelectedId(id);
  };

  const removeSelected = () => {
    if (!selected) return;
    onChange(overlays.filter(o => o.id !== selected.id));
    setSelectedId(null);
  };

  const updateSelected = (patch: Partial<TextOverlay> | Partial<ShapeOverlay>) => {
    if (!selected) return;
    const idx = overlays.findIndex(o => o.id === selected.id);
    if (idx < 0) return;
    const copy = overlays.slice();
    copy[idx] = { ...(copy[idx] as Overlay), ...(patch as Partial<Overlay>) } as Overlay;
    onChange(copy);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-purple-50 to-pink-50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          <button onClick={addText} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">+ Text</button>
          <button onClick={() => addShape('heart')} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm">+ Heart</button>
          <button onClick={() => addShape('star')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm">+ Star</button>
          <button onClick={() => addShape('sparkle')} className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm">+ Sparkle</button>
        </div>
      </div>

      {/* Preview/drag area */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-gray-50 border-t border-b border-gray-200"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,rgba(0,0,0,0.03)_25px),linear-gradient(90deg,transparent_24px,rgba(0,0,0,0.03)_25px)] bg-size-[25px_25px]"></div>
        {overlays.map((ov) => (
          <div
            key={ov.id}
            className={`absolute select-none ${selectedId === ov.id ? 'ring-2 ring-purple-500 rounded' : ''}`}
            style={{ left: `${ov.x * 100}%`, top: `${ov.y * 100}%`, transform: 'translate(-50%, -50%)' }}
            onPointerDown={(e) => onPointerDown(e, ov.id)}
          >
            {isTextOverlay(ov) ? (
              <div
                className="px-1"
                style={{
                  color: (ov as TextOverlay).color,
                  fontWeight: (ov as TextOverlay).bold ? 700 : 400,
                  fontSize: (ov as TextOverlay).fontSize,
                  textShadow: (ov as TextOverlay).shadowColor && (ov as TextOverlay).shadowBlur ? `0 0 ${(ov as TextOverlay).shadowBlur}px ${(ov as TextOverlay).shadowColor}` : undefined,
                }}
              >
                {(ov as TextOverlay).text}
              </div>
            ) : (
              <ShapePreview ov={ov as ShapeOverlay} />
            )}
          </div>
        ))}
      </div>

      {/* Inspector */}
      <div className="p-3">
        {!selected ? (
          <p className="text-sm text-gray-600">Chọn một overlay để chỉnh sửa. Bạn có thể kéo-thả trên khung preview.</p>
        ) : isTextOverlay(selected) ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-700">Nội dung</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={(selected as TextOverlay).text}
                onChange={(e) => updateSelected({ text: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Màu chữ</label>
              <input type="color" className="mt-1 w-full h-9" value={(selected as TextOverlay).color}
                onChange={(e) => updateSelected({ color: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Cỡ chữ</label>
              <input type="range" min={12} max={120} value={(selected as TextOverlay).fontSize}
                onChange={(e) => updateSelected({ fontSize: parseInt(e.target.value, 10) })} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Viền (màu)</label>
              <input type="color" className="mt-1 w-full h-9" value={(selected as TextOverlay).outlineColor || '#000000'}
                onChange={(e) => updateSelected({ outlineColor: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Viền (độ dày)</label>
              <input type="range" min={0} max={10} value={(selected as TextOverlay).outlineWidth || 0}
                onChange={(e) => updateSelected({ outlineWidth: parseInt(e.target.value, 10) })} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Bóng (màu)</label>
              <input type="color" className="mt-1 w-full h-9" value={(selected as TextOverlay).shadowColor || '#000000'}
                onChange={(e) => updateSelected({ shadowColor: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Bóng (độ mờ)</label>
              <input type="range" min={0} max={20} value={(selected as TextOverlay).shadowBlur || 0}
                onChange={(e) => updateSelected({ shadowBlur: parseInt(e.target.value, 10) })} className="w-full" />
            </div>
            <div className="flex items-end">
              <label className="text-xs font-semibold text-gray-700 mr-2">Đậm</label>
              <input type="checkbox" checked={(selected as TextOverlay).bold || false}
                onChange={(e) => updateSelected({ bold: e.target.checked })} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button onClick={removeSelected} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm">Xoá overlay</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Màu</label>
              <input type="color" className="mt-1 w-full h-9" value={(selected as ShapeOverlay).fill}
                onChange={(e) => updateSelected({ fill: e.target.value } as Partial<ShapeOverlay>)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Cỡ</label>
              <input type="range" min={10} max={160} value={(selected as ShapeOverlay).size}
                onChange={(e) => updateSelected({ size: parseInt(e.target.value, 10) } as Partial<ShapeOverlay>)} className="w-full" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button onClick={removeSelected} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm">Xoá overlay</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isTextOverlay(ov: Overlay): ov is TextOverlay {
  return (ov as TextOverlay).type === 'text';
}

function ShapePreview({ ov }: { ov: ShapeOverlay }) {
  const size = ov.size || 24;
  const style: React.CSSProperties = { width: size * 2, height: size * 2 };
  switch (ov.shape) {
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <path d="M50 80 C 20 60, 5 45, 20 25 C 35 10, 50 25, 50 25 C 50 25, 65 10, 80 25 C 95 45, 80 60, 50 80 Z" fill={ov.fill} stroke={ov.stroke} strokeWidth={ov.strokeWidth} />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <polygon points="50,5 61,35 95,35 67,55 77,87 50,68 23,87 33,55 5,35 39,35" fill={ov.fill} stroke={ov.stroke} strokeWidth={ov.strokeWidth} />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <line x1="50" y1="10" x2="50" y2="90" stroke={ov.fill} strokeWidth={ov.strokeWidth || 4} />
          <line x1="10" y1="50" x2="90" y2="50" stroke={ov.fill} strokeWidth={ov.strokeWidth || 4} />
        </svg>
      );
  }
}
