'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FrameId } from '@/src/types';

interface FrameSelectorProps {
  selectedFrame: FrameId;
  onFrameChange: (frame: FrameId) => void;
}

const frames: { id: FrameId; name: string; icon: string; note?: string }[] = [
  { id: 'none', name: 'Không khung', icon: '🪄' },
  { id: 'polaroid', name: 'Polaroid', icon: '📷', note: 'viền trắng + dải dưới' },
  { id: 'film', name: 'Film', icon: '🎞️', note: 'viền đen lỗ cuộn' },
  { id: 'neon', name: 'Neon', icon: '💡', note: 'viền dạ quang' },
  { id: 'gold', name: 'Gold', icon: '🏅', note: 'viền vàng gradient' },
  { id: 'tape', name: 'Tape', icon: '📌', note: 'băng dính 4 góc' },
  { id: 'christmas', name: 'Noel', icon: '🎄', note: 'đỏ xanh + tuyết' },
  { id: 'tet', name: 'Tết', icon: '🧧', note: 'đỏ + vàng' },
  { id: 'birthday', name: 'Sinh nhật', icon: '🎉', note: 'confetti vui nhộn' },
  { id: 'wedding', name: 'Wedding', icon: '💍', note: 'trắng + vàng sang' },
];

export default function FrameSelector({ selectedFrame, onFrameChange }: FrameSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 pt-0">
      {frames.map((f) => (
        <motion.button
          key={f.id}
          onClick={() => onFrameChange(f.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedFrame === f.id
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title={f.note}
        >
          <span className="mr-1">{f.icon}</span>
          {f.name}
        </motion.button>
      ))}
    </div>
  );
}
