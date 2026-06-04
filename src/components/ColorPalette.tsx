/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const PRESET_COLORS = [
  { value: '#ffffff', name: 'Gesso' },
  { value: '#0f172a', name: 'Ardesia' },
  { value: '#ef4444', name: 'Fuoco' },
  { value: '#f97316', name: 'Arancia' },
  { value: '#eab308', name: 'Limone' },
  { value: '#22c55e', name: 'Glow' },
  { value: '#06b6d4', name: 'Ciano' },
  { value: '#3b82f6', name: 'Neon' },
  { value: '#a855f7', name: 'Viola' },
  { value: '#ec4899', name: 'Pop' },
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider hidden sm:block">
        Tinta:
      </span>
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-full border-2 border-black shadow-[2px_2px_0px_#000]">
        {PRESET_COLORS.map((color) => {
          const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
          return (
            <motion.button
              key={color.value}
              type="button"
              id={`color-${color.value.replace('#', '')}`}
              onClick={() => onColorSelect(color.value)}
              className={`w-6 h-6 rounded-full border-2 border-black cursor-pointer transition-all focus:outline-none flex items-center justify-center relative`}
              style={{
                backgroundColor: color.value,
              }}
              title={color.name}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              whileTap={{ scale: 0.85 }}
            >
              {isSelected && (
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: color.value === '#ffffff' ? '#000000' : '#ffffff' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

