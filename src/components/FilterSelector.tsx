'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FilterType } from '@/src/types';

interface FilterSelectorProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { name: string; value: FilterType; icon: string }[] = [
  { name: 'Gốc', value: 'none', icon: '🎨' },
  { name: 'Đen trắng', value: 'grayscale', icon: '⚫' },
  { name: 'Sepia', value: 'sepia', icon: '📜' },
  { name: 'Vintage', value: 'vintage', icon: '📷' },
  { name: 'Ấm', value: 'warm', icon: '🔥' },
  { name: 'Lạnh', value: 'cool', icon: '❄️' },
  { name: 'Sáng', value: 'bright', icon: '☀️' },
  { name: 'Tương phản', value: 'contrast', icon: '⚡' },
];

export default function FilterSelector({ selectedFilter, onFilterChange }: FilterSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedFilter === filter.value
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span className="mr-1">{filter.icon}</span>
          {filter.name}
        </motion.button>
      ))}
    </div>
  );
}
