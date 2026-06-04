/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BrushType = 'pencil' | 'neon' | 'rainbow' | 'drippy' | 'shaky' | 'shapes';

export type TextEffectMode = 'static' | 'gravity' | 'jitter' | 'float' | 'explode';

export interface TextElement {
  id: string;
  char: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  scale: number;
  color: string;
  size: number;
  life: number; // For fading elements or particle effects
  opacity: number;
  pulseOffset: number;
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  brush: BrushType;
}

export interface SoundSettings {
  pitchMultiplier: number;
  volume: number;
  mute: boolean;
}
