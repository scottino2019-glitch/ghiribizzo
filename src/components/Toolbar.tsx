/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  PenTool, 
  Zap, 
  Sparkles, 
  Droplet, 
  Flame, 
  Activity, 
  Coins, 
  Anchor, 
  Wind, 
  Compass,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { BrushType, TextEffectMode } from '../types';

interface ToolbarProps {
  brushType: BrushType;
  setBrushType: (b: BrushType) => void;
  textEffect: TextEffectMode;
  setTextEffect: (e: TextEffectMode) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  textSize: number;
  setTextSize: (s: number) => void;
  canvasBg: string;
  setCanvasBg: (bg: string) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  soundMuted: boolean;
  setSoundMuted: (m: boolean) => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  brushType,
  setBrushType,
  textEffect,
  setTextEffect,
  brushSize,
  setBrushSize,
  textSize,
  setTextSize,
  canvasBg,
  setCanvasBg,
  soundVolume,
  setSoundVolume,
  soundMuted,
  setSoundMuted,
  onClear,
  onUndo,
  canUndo,
}) => {
  const BRUSHES: { type: BrushType; label: string; icon: any; desc: string }[] = [
    { type: 'pencil', label: 'Gesso', icon: PenTool, desc: 'Disegno a mano libera semplice' },
    { type: 'neon', label: 'Neon Glow', icon: Zap, desc: 'Linea incandescente sfocata' },
    { type: 'rainbow', label: 'Arcobaleno', icon: Sparkles, desc: 'Cambia sfumature mentre disegni' },
    { type: 'drippy', label: 'Vernice', icon: Droplet, desc: 'Rilascia goccioline che colano' },
    { type: 'shaky', label: 'Treolio', icon: Activity, desc: 'Una traccia instabile e dinamica' },
    { type: 'shapes', label: 'Stelle', icon: Compass, desc: 'Moltiplica forme geometriche' },
  ];

  const TEXT_EFFECTS: { mode: TextEffectMode; label: string; icon: any; desc: string }[] = [
    { mode: 'static', label: 'Fisse', icon: Anchor, desc: 'La scrittura rimane fissa dove clicchi' },
    { mode: 'gravity', label: 'Cascata', icon: Flame, desc: 'Le lettere cadono e rimbalzano sul fondo' },
    { mode: 'jitter', label: 'Panico!', icon: Activity, desc: 'Le parole tremano e vibrano sul posto' },
    { mode: 'float', label: 'Bolle', icon: Wind, desc: 'Le lettere volano verso l\'alto' },
    { mode: 'explode', label: 'Esplosione', icon: Coins, desc: 'Spruzzi di lettere che svaniscono' },
  ];

  return (
    <div className="flex flex-col gap-5 p-5 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000000] text-black w-full md:w-80 shrink-0 overflow-y-auto select-none">
      
      {/* Visual Identity Title - Pop Art Banner style */}
      <div className="flex flex-col gap-2 bg-[#FF007A] text-white p-3.5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000] text-center">
        <h1 className="text-xl font-black tracking-tight flex items-center justify-center gap-1">
          GHIRIBIZZO 🌀
        </h1>
        <p className="text-[10px] text-yellow-300 font-extrabold uppercase tracking-wide">
          Disegno Sonico & Scrittura Pazza
        </p>
      </div>

      {/* Brush Settings */}
      <div className="flex flex-col gap-3">
        <div className="bg-[#00E5FF] text-black border-2 border-black py-1.5 px-3 text-center text-xs uppercase tracking-widest font-black rounded-lg shadow-[2px_2px_0px_#000]">
          Pennello
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BRUSHES.map((b) => {
            const isSelected = brushType === b.type;
            const Icon = b.icon;
            return (
              <motion.button
                key={b.type}
                type="button"
                id={`brush-${b.type}`}
                onClick={() => setBrushType(b.type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-black transition-all cursor-pointer focus:outline-none ${
                  isSelected 
                    ? 'bg-[#FFDE03] text-black font-black shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100 font-bold hover:shadow-[1px_1px_0px_#000]'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                title={b.desc}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-slate-600'}`} />
                <span className="text-[11px] font-black tracking-tight truncate w-full">{b.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Brush Size Slider */}
        <div className="flex flex-col gap-1 mt-1 bg-slate-50 p-2.5 border-2 border-black rounded-xl">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Spessore Tratto</span>
            <span className="font-mono text-[#FF007A] font-black">{brushSize}px</span>
          </div>
          <input
            type="range"
            id="slider-brush-size"
            min="2"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 border border-black rounded-lg appearance-none accent-black cursor-pointer"
          />
        </div>
      </div>

      {/* Keyboard effects Settings */}
      <div className="flex flex-col gap-3">
        <div className="bg-[#FF8A00] text-black border-2 border-black py-1.5 px-3 text-center text-xs uppercase tracking-widest font-black rounded-lg shadow-[2px_2px_0px_#000]">
          Effetti Lettere
        </div>
        <div className="grid grid-cols-1 gap-2">
          {TEXT_EFFECTS.map((te) => {
            const isSelected = textEffect === te.mode;
            const Icon = te.icon;
            return (
              <motion.button
                key={te.mode}
                type="button"
                id={`effect-${te.mode}`}
                onClick={() => setTextEffect(te.mode)}
                className={`flex items-center gap-3 p-2 rounded-xl border-2 border-black transition-all cursor-pointer focus:outline-none ${
                  isSelected 
                    ? 'bg-[#00FF41] text-black font-black shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100 font-bold'
                }`}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                title={te.desc}
              >
                <div className={`p-1.5 rounded-lg border border-black ${isSelected ? 'bg-white text-black' : 'bg-slate-200 text-slate-600'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col justify-center min-w-0 text-left">
                  <span className="text-xs font-extrabold leading-none">{te.label}</span>
                  <span className="text-[10px] text-slate-500 truncate mt-1 leading-none">{te.desc}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Text Size Slider */}
        <div className="flex flex-col gap-1 mt-1 bg-slate-50 p-2.5 border-2 border-black rounded-xl">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Dimensione Testo</span>
            <span className="font-mono text-[#00E5FF] font-black">{textSize}px</span>
          </div>
          <input
            type="range"
            id="slider-text-size"
            min="16"
            max="250"
            value={textSize}
            onChange={(e) => setTextSize(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 border border-black rounded-lg appearance-none accent-black cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-extrabold mt-0.5">
            <span>Piccolo</span>
            <span>Consigliato (60-120px)</span>
            <span>Gigante</span>
          </div>
        </div>
      </div>

      {/* Board Environment Options */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
          Colore Lavagna
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: '#0b0f19', name: 'Nero' },
            { value: '#1e293b', name: 'Grigio' },
            { value: '#f8fafc', name: 'Bianco' },
          ].map((bg) => (
            <button
              key={bg.value}
              type="button"
              id={`bg-${bg.value.replace('#', '')}`}
              onClick={() => setCanvasBg(bg.value)}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-black border-2 border-black transition-all cursor-pointer focus:outline-none ${
                canvasBg === bg.value 
                  ? 'bg-slate-900 border-black text-white font-black shadow-[2px_2px_0px_#000]' 
                  : 'bg-white border-black text-black hover:bg-slate-100'
              }`}
            >
              <span>{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Audio volume Controls */}
      <div className="flex flex-col gap-2 border-t-2 border-black pt-3 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Audio Synth</span>
          <button
            type="button"
            id="btn-toggle-mute"
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1 rounded-lg border-2 border-black bg-white hover:bg-slate-50 transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-[1px_1px_0px_#000]"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
        {!soundMuted && (
          <div className="flex flex-col gap-1">
            <input
              type="range"
              id="slider-sound-volume"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 border border-black rounded-lg appearance-none accent-black cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Erase & Undo Buttons */}
      <div className="grid grid-cols-2 gap-2 border-t-2 border-black pt-3">
        <motion.button
          type="button"
          id="btn-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer focus:outline-none ${
            canUndo 
              ? 'bg-[#FFDE03] text-black shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]' 
              : 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed shadow-none'
          }`}
          whileHover={canUndo ? { scale: 1.02 } : {}}
          whileTap={canUndo ? { scale: 0.98 } : {}}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Annulla
        </motion.button>
        
        <motion.button
          type="button"
          id="btn-clear"
          onClick={onClear}
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#FF007A] border-2 border-black text-white shadow-[3px_3px_0px_#000] text-xs font-black transition-all cursor-pointer focus:outline-none hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
          Pulisci
        </motion.button>
      </div>

    </div>
  );
};

