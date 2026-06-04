/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  HelpCircle, 
  AlertCircle, 
  X,
  Volume2,
  Sparkles,
  Info
} from 'lucide-react';
import { BrushType, TextEffectMode, TextElement, DrawingPath } from './types';
import { audioService } from './utils/audio';
import { Toolbar } from './components/Toolbar';
import { ColorPalette } from './components/ColorPalette';
import { RecordingStatus } from './components/RecordingStatus';

interface PaintDrip {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
}

const FONTS = [
  { id: 'Special Elite', label: 'Tipo Macchina da Scrivere', style: 'font-["Special_Elite"]' },
  { id: 'Caveat', label: 'Corsivo Scarabocchiato', style: 'font-["Caveat"]' },
  { id: 'Orbitron', label: 'Futurista Cyberpunk', style: 'font-["Orbitron"]' },
  { id: 'Outfit', label: 'Lineare Moderno', style: 'font-sans font-extrabold' },
];








export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom states
  const [brushType, setBrushType] = useState<BrushType>('pencil');
  const [textEffect, setTextEffect] = useState<TextEffectMode>('gravity');
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(6);
  const [textSize, setTextSize] = useState(64);
  const [canvasBg, setCanvasBg] = useState('#0b0f19');
  
  const [selectedFont, setSelectedFont] = useState('Special Elite');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [soundMuted, setSoundMuted] = useState(false);

  // Drawing elements managed as high-performance Refs to bypass React re-renders completely
  const pathsRef = useRef<DrawingPath[]>([]);
  const currentPathRef = useRef<DrawingPath | null>(null);
  const textElementsRef = useRef<TextElement[]>([]);
  const dripsRef = useRef<PaintDrip[]>([]);
  
  // Unified undo history stack
  const historyRef = useRef<{ paths: DrawingPath[]; textElements: TextElement[] }[]>([]);

  // Simple, discrete states for the UI parameters
  const [canUndo, setCanUndo] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);

  // Typing cursor coordinates and Multilingual states
  const [cursorPos, setCursorPos] = useState({ x: 200, y: 250 });
  const cursorStartRef = useRef({ x: 200, y: 250 });
  const [isTypingActive, setIsTypingActive] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  
  const [composingText, setComposingText] = useState('');
  const isComposingRef = useRef(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Recording status
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingUnsupported, setRecordingUnsupported] = useState(false);

  // Instruction Modal
  const [showInstructions, setShowInstructions] = useState(true);

  // Transition Hook for heavy state updates
  const [, startTransition] = useTransition();

  // Rainbow hue variable tracker
  const hueRef = useRef(0);

  // Tracking drawing state
  const isMouseDownRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Helper to save current step to history
  const saveHistorySnapshot = () => {
    const snapshot = {
      paths: pathsRef.current.map(p => ({
        ...p,
        points: [...p.points]
      })),
      textElements: textElementsRef.current.map(el => ({
        ...el
      })),
    };
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }
    setCanUndo(true);
    setCanvasEmpty(false);
  };

  // Handle Master Sound config updates
  useEffect(() => {
    audioService.setVolume(soundVolume);
    audioService.setMute(soundMuted);
  }, [soundVolume, soundMuted]);

  // Blink cursor
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(timer);
  }, []);

  // Update sound engine on volume settings change
  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
  };

  const handleMutedChange = (mute: boolean) => {
    setSoundMuted(mute);
  };

  // Undo triggers
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    audioService.playTypewriterClack(true, false);
    
    const prevState = historyRef.current.pop();
    if (prevState) {
      pathsRef.current = prevState.paths;
      textElementsRef.current = prevState.textElements;
    } else {
      pathsRef.current = [];
      textElementsRef.current = [];
    }
    
    setCanUndo(historyRef.current.length > 0);
    setCanvasEmpty(pathsRef.current.length === 0 && textElementsRef.current.length === 0);
  };

  const handleClear = () => {
    audioService.playClearSound();
    saveHistorySnapshot();
    pathsRef.current = [];
    textElementsRef.current = [];
    dripsRef.current = [];
    setCanvasEmpty(true);
  };

  // Commit a single character to the canvas!
  const commitSingleCharacter = (char: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Play typewriter sound
    audioService.playTypewriterClack(false, false);

    const pulseOffset = Math.random() * 100;
    const isExploding = textEffect === 'explode';
    const isGravity = textEffect === 'gravity';
    const angle = Math.random() * 0.16 - 0.08;

    const newChar: TextElement = {
      id: Math.random().toString(36).substring(2, 9),
      char,
      x: cursorPos.x,
      y: cursorPos.y,
      targetX: cursorPos.x,
      targetY: cursorPos.y,
      vx: isExploding ? (Math.random() * 8 - 4) : isGravity ? (Math.random() * 1.5 - 0.75) : 0,
      vy: isExploding ? (-Math.random() * 6 - 3) : 0,
      rotation: isExploding ? Math.random() * Math.PI : angle,
      vRotation: isExploding ? (Math.random() * 0.15 - 0.075) : 0,
      scale: 1,
      color: brushColor,
      size: textSize,
      life: 9999,
      opacity: 1,
      pulseOffset,
    };

    saveHistorySnapshot();
    textElementsRef.current.push(newChar);
    setCanvasEmpty(false);

    // Advance cursor
    const charWidth = textSize * 0.55;
    const nextX = cursorPos.x + charWidth;

    if (nextX > canvas.width - 40) {
      audioService.playTypewriterClack(false, true); // carriage ding!
      setCursorPos((prev) => ({
        x: cursorStartRef.current.x,
        y: prev.y + textSize * 1.25 > canvas.height - 45 ? 80 : prev.y + textSize * 1.25
      }));
    } else {
      setCursorPos((prev) => ({ ...prev, x: nextX }));
    }
  };

  // Safe multicharacter processor (e.g. paste or native IME selection)
  const insertTextCharacters = (text: string) => {
    if (!text) return;
    text.split('').forEach((char) => {
      commitSingleCharacter(char);
    });
  };

  // Keyboard and Input bridge handlers
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    setComposingText(e.data);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    setComposingText('');
    insertTextCharacters(e.data);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!isComposingRef.current) {
      if (text) {
        insertTextCharacters(text);
        e.target.value = '';
      }
    } else {
      setComposingText(text);
    }
  };

  const handleHiddenInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      audioService.playTypewriterClack(true, false);
      
      if (textElementsRef.current.length > 0) {
        saveHistorySnapshot();
        textElementsRef.current.pop();
        setCanvasEmpty(pathsRef.current.length === 0 && textElementsRef.current.length === 0);
        
        // Adjust cursor back
        setCursorPos((curr) => ({
          ...curr,
          x: Math.max(20, curr.x - textSize * 0.55),
        }));
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      audioService.playTypewriterClack(false, true); // carriage ding!
      
      setCursorPos((prev) => {
        const nextY = prev.y + textSize * 1.25;
        const nextX = cursorStartRef.current.x;
        return { x: nextX, y: nextY > canvas.height - 40 ? 80 : nextY };
      });
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      audioService.playTypewriterClack(true, false);
      
      setCursorPos((prev) => ({
        ...prev,
        x: Math.min(canvas.width - 30, prev.x + textSize * 0.45),
      }));
      return;
    }
  };

  // Keep hidden input focused
  useEffect(() => {
    if (isTypingActive && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [isTypingActive]);

  // Redirect keydown focus to hiddenInput Ref
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' && 
        document.activeElement?.id !== 'hidden-multilingual-input'
      ) {
        return;
      }
      if (document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (isTypingActive && hiddenInputRef.current) {
        if (document.activeElement !== hiddenInputRef.current) {
          hiddenInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isTypingActive]);

  // Main Canvas Setup, Resize Observer and Core Render Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      
      // Save canvas contents temporarily so resize doesn't clear drawing if no paths yet
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      // Set physical resolutions matching responsive screen
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Redraw temp cache if layout updates
      ctx.drawImage(tempCanvas, 0, 0);
    };

    // Attach ResizeObserver natively to container div to follow responsive layout sizes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Call first dimensions check
    handleResize();

    // Spline curve interpolation to make handwriting look beautiful, smooth, and fluid!
    const drawSmoothPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
        return;
      }
      
      let i;
      for (i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      
      ctx.quadraticCurveTo(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y
      );
      ctx.stroke();
    };

    // Constant tick loop for drawing canvas renders and moving letter variables
    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear with customized background
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, w, h);

      // Draw aesthetic background grid system (Gives a gorgeous space blueprint lab feel!)
      const isLightBg = canvasBg === '#f8fafc';
      ctx.strokeStyle = isLightBg ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      
      const gridSpacing = 40;
      // Draw vertical lines
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Draw horizontal lines
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw beautiful retro dots
      ctx.fillStyle = isLightBg ? 'rgba(15,23,42,0.15)' : 'rgba(255,255,255,0.1)';
      for (let x = gridSpacing; x < w; x += gridSpacing * 2) {
        for (let y = gridSpacing; y < h; y += gridSpacing * 2) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Render static completed lines in vector format
      pathsRef.current.forEach((path) => {
        if (path.points.length < 1) return;
        ctx.save();
        
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (path.brush === 'neon') {
          ctx.strokeStyle = path.color;
          ctx.shadowColor = path.color;
          ctx.shadowBlur = path.width * 1.8;
        } else {
          ctx.strokeStyle = path.color;
          ctx.shadowBlur = 0;
        }

        ctx.strokeStyle = path.color;
        drawSmoothPath(path.points);
        ctx.restore();
      });

      // 3. Draw active drawing path
      const currentPath = currentPathRef.current;
      if (currentPath && currentPath.points.length > 0) {
        ctx.save();
        ctx.lineWidth = currentPath.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentPath.brush === 'neon') {
          ctx.strokeStyle = currentPath.color;
          ctx.shadowColor = currentPath.color;
          ctx.shadowBlur = currentPath.width * 1.8;
        } else {
          ctx.strokeStyle = currentPath.color;
          ctx.shadowBlur = 0;
        }

        ctx.strokeStyle = currentPath.color;
        drawSmoothPath(currentPath.points);
        ctx.restore();
      }

      // 4. Update and Drawing paint drippies
      const activeDrips = dripsRef.current;
      dripsRef.current = activeDrips
        .map((drip) => {
          // Render drip
          ctx.save();
          ctx.fillStyle = drip.color;
          ctx.globalAlpha = drip.opacity;
          ctx.beginPath();
          ctx.arc(drip.x, drip.y, drip.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Sim slowly descending
          return {
            ...drip,
            y: drip.y + drip.vy,
            vy: drip.vy + 0.05, // minor accel
            radius: drip.radius * 0.985, // dries up
            opacity: drip.opacity - 0.005, // fades out
          };
        })
        .filter((drip) => drip.opacity > 0.05 && drip.radius > 0.5);

      // 5. Update and Draw Typewritten Letters
      const time = Date.now();
      textElementsRef.current = textElementsRef.current
        .map((el) => {
          // Apply physics depending on text effect
          let nextX = el.x;
          let nextY = el.y;
          let nextVx = el.vx;
          let nextVy = el.vy;
          let nextRotation = el.rotation;
          let nextOpacity = el.opacity;
          let nextLife = el.life;

          if (textEffect === 'gravity') {
            // Apply simple gravity
            if (el.y < h - el.size * 0.45) {
              nextVy += 0.38; // Gravitational force
              nextY += nextVy;
              nextX += nextVx;
            } else {
              // Ground collision bouncing!
              nextY = h - el.size * 0.45;
              nextVy = -nextVy * 0.5; // elastic rebound
              nextVx *= 0.75; // ground friction

              // Play boing sound if bounce velocity is substantial
              if (Math.abs(nextVy) > 1.8 && !soundMuted) {
                audioService.playBoingSound();
              }

              if (Math.abs(nextVy) < 0.4) {
                nextVy = 0;
              }
            }

            // Side boundaries bounce
            if (nextX < el.size * 0.45) {
              nextX = el.size * 0.45;
              nextVx = -nextVx * 0.6;
            } else if (nextX > w - el.size * 0.45) {
              nextX = w - el.size * 0.45;
              nextVx = -nextVx * 0.6;
            }

            // Apply rot update
            nextRotation += nextVx * 0.02;

          } else if (textEffect === 'float') {
            // Drift and float upwards relative to its original row baseline (el.targetY)
            // It floats up by about 1.5 times the character size and bobs there gently,
            // which preserves the line spacing (interlinea) and prevents overlapping rows!
            const floatLimit = el.size * 1.5;
            const targetY = el.targetY - floatLimit;

            // Accelerate upward towards targetY
            if (nextY > targetY) {
              nextVy -= 0.12; // gentle rise acceleration
              nextVy = Math.max(-3, nextVy); // limit speed
              nextY += nextVy;
            } else {
              // Once it reaches or passes the targeted float position, bob gently using a sine wave
              const bobFreq = 0.02 + el.pulseOffset * 0.0003;
              const bobAmp = el.size * 0.12; // bobbing amplitude
              nextY = targetY + Math.sin(time * bobFreq) * bobAmp;
              nextVy = 0;
            }

            // Subtle horizontal drift
            const driftFreq = 0.01 + el.pulseOffset * 0.0002;
            nextX += Math.sin(time * driftFreq) * 0.35;

            nextRotation = Math.sin(time * 0.02 + el.pulseOffset) * 0.06;

          } else if (textEffect === 'jitter') {
            // Vibrate intensely on target coordinates
            nextX = el.targetX + (Math.random() * 4 - 2);
            nextY = el.targetY + (Math.random() * 4 - 2);
            nextRotation = el.rotation + (Math.random() * 0.06 - 0.03);

          } else if (textEffect === 'explode') {
            // Physics dispersion explosion (high initial velocity) with gravity and bouncing so it stays on screen!
            nextVy += 0.38; // Gravitational force
            nextY += nextVy;
            nextX += nextVx;

            // Ground floor bounce
            if (nextY >= h - el.size * 0.45) {
              nextY = h - el.size * 0.45;
              nextVy = -nextVy * 0.52; // bounce rebound
              nextVx *= 0.78; // ground friction

              // Play boing sound if bounce velocity is substantial
              if (Math.abs(nextVy) > 1.8 && !soundMuted) {
                audioService.playBoingSound();
              }

              if (Math.abs(nextVy) < 0.4) {
                nextVy = 0;
              }
            }

            // Side boundaries bounce
            if (nextX < el.size * 0.45) {
              nextX = el.size * 0.45;
              nextVx = -nextVx * 0.6;
            } else if (nextX > w - el.size * 0.45) {
              nextX = w - el.size * 0.45;
              nextVx = -nextVx * 0.6;
            }

            // Spin with velocity
            nextRotation += nextVx * 0.02;
          } else {
            // Static mode: subtle organic micro vibration (gives life!)
            const swayFreq = 0.005 + el.pulseOffset * 0.0001;
            nextY = el.targetY + Math.sin(time * swayFreq + el.pulseOffset) * 1.5;
          }

          return {
            ...el,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            rotation: nextRotation,
            opacity: nextOpacity,
            life: nextLife,
          };
        })
        .filter((el) => el.life > 0 && el.opacity > 0.01);

      // Render each typography character
      textElementsRef.current.forEach((el) => {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rotation);
        
        ctx.globalAlpha = el.opacity;
        ctx.fillStyle = el.color;

        // Customize typography styling rendering based on selected font style
        let fontConfig = `${el.size}px "Special Elite", serif`;
        if (selectedFont === 'Caveat') {
          fontConfig = `bold ${el.size * 1.15}px "Caveat", cursive`;
        } else if (selectedFont === 'Orbitron') {
          fontConfig = `bold ${el.size * 0.88}px "Orbitron", sans-serif`;
        } else if (selectedFont === 'Outfit') {
          fontConfig = `900 ${el.size * 0.95}px "Outfit", sans-serif`;
        }

        ctx.font = fontConfig;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Extra styling additions
        if (brushType === 'neon') {
          ctx.shadowColor = el.color;
          ctx.shadowBlur = 10;
        }

        ctx.fillText(el.char, 0, 0);
        ctx.restore();
      });

      // 6. Draw keyboard Typing cursor indicator
      if (isTypingActive && cursorVisible) {
        ctx.save();
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.85;

        // Draw elegant cursor caret
        ctx.fillRect(
          cursorPos.x - 2, 
          cursorPos.y - textSize * 0.7, 
          3, 
          textSize * 0.9
        );

        // Circle halo indicating mouse position typing is ready
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.07;
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y - textSize * 0.25, textSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [canvasBg, textEffect, selectedFont, brushType, isTypingActive, brushColor, textSize, cursorVisible, cursorPos, soundMuted]);

  // Touch & Mouse Event Handlers for Writing Freehand
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length < 1) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    isMouseDownRef.current = true;
    lastPointRef.current = coords;

    // Define typing cursor where drawing begins
    setCursorPos(coords);
    cursorStartRef.current = coords;

    // Focus our magic input bridge for active typing/IME processing!
    if (isTypingActive && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }

    // Handle initial drawing point
    let finalColor = brushColor;
    if (brushType === 'rainbow') {
      hueRef.current = (hueRef.current + 8) % 360;
      finalColor = `hsl(${hueRef.current}, 100%, 50%)`;
    }

    const newPath: DrawingPath = {
      points: [coords],
      color: finalColor,
      width: brushSize,
      brush: brushType,
    };

    currentPathRef.current = newPath;
    setCanvasEmpty(false);

    // Minor sound start
    audioService.updateScribbleVolume(10);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !currentPathRef.current || !lastPointRef.current) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    // Calculate drawing speed for scrape sound volume modulation and effect density
    const dx = coords.x - lastPointRef.current.x;
    const dy = coords.y - lastPointRef.current.y;
    const distance = Math.hypot(dx, dy);

    audioService.updateScribbleVolume(distance);

    let finalColor = brushColor;
    if (brushType === 'rainbow') {
      hueRef.current = (hueRef.current + 3) % 360;
      finalColor = `hsl(${hueRef.current}, 100%, 50%)`;
    }

    // Brush specialized logic integration:
    if (brushType === 'drippy') {
      // Spawn paint drips if drawn at decent speed
      if (Math.random() < 0.18 + distance * 0.005) {
        const dripRadius = brushSize * (0.2 + Math.random() * 0.3);
        const drip: PaintDrip = {
          x: coords.x,
          y: coords.y,
          vy: 0.1 + Math.random() * 0.4,
          radius: dripRadius,
          color: brushColor,
          opacity: 0.9,
        };
        dripsRef.current.push(drip);
      }
    } else if (brushType === 'shaky') {
      // Add random jitter noise offsets to segment coords
      const jitterVal = brushSize * 0.45;
      coords.x += Math.random() * jitterVal - jitterVal / 2;
      coords.y += Math.random() * jitterVal - jitterVal / 2;
    } else if (brushType === 'shapes') {
      // Occasionally drops beautiful stars or circles
      if (Math.random() < 0.22) {
        const shapeType = Math.random() > 0.5 ? '★' : '●';
        const angle = Math.random() * Math.PI;
        const sizeDelta = brushSize * 1.5 + 8;
        const pulse = Math.random() * 100;

        const shapeAsLetter: TextElement = {
          id: Math.random().toString(36).substring(2, 9),
          char: shapeType,
          x: coords.x,
          y: coords.y,
          targetX: coords.x,
          targetY: coords.y,
          vx: Math.random() * 1 - 0.5,
          vy: 0,
          rotation: angle,
          vRotation: 0,
          scale: 1,
          color: brushColor,
          size: sizeDelta,
          life: 9999,
          opacity: 0.8,
          pulseOffset: pulse,
        };

        textElementsRef.current.push(shapeAsLetter);
      }
    }

    // Append drawing point
    currentPathRef.current.points.push(coords);
    if (brushType === 'rainbow') {
      currentPathRef.current.color = finalColor;
    }

    lastPointRef.current = coords;
  };

  const handlePointerEnd = () => {
    isMouseDownRef.current = false;
    lastPointRef.current = null;
    audioService.stopScribbleVolume();

    if (currentPathRef.current) {
      saveHistorySnapshot();
      
      // Push drawn segment onto persistent vectors path
      pathsRef.current.push(currentPathRef.current);
      currentPathRef.current = null;
      setCanUndo(true);
      setCanvasEmpty(false);
    }
  };

  // Video Media Recorder functions
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    audioService.playRecordCue(true);

    try {
      setRecordedChunks([]);
      setRecordedVideoUrl(null);

      // Grabs canvas stream at responsive rate
      const canvasStream = canvas.captureStream(30);

      // We attempt to mix Web Audio API retro clicking sounds into recorded stream
      const tracks = [...canvasStream.getVideoTracks()];
      const synthesizerAudioTrack = audioService.getAudioStreamTrack();
      
      if (synthesizerAudioTrack) {
        tracks.push(synthesizerAudioTrack);
      }

      const combinedStream = new MediaStream(tracks);

      // Fallback matching logic for recorder codecs on various systems
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: '' }; // native fallback
          }
        }
      }

      const recorder = new MediaRecorder(combinedStream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        // Stop is triggered
      };

      recorder.start(100); // chunk size ms
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (e) {
      console.error('Recording setup error:', e);
      setRecordingUnsupported(true);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    
    audioService.playRecordCue(false);
    mediaRecorder.stop();
    setIsRecording(false);
  };

  // Trigger blob compilation download URL callback
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    }
  }, [recordedChunks, isRecording]);

  const handleDownloadVideo = () => {
    if (!recordedVideoUrl) return;

    // Trigger download anchor
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    
    // Add unique dates to video names
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `scarabocchio-pazzo-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-screen w-full bg-[#FFDE03] overflow-hidden text-black flex-col md:flex-row gap-5 p-5 font-sans">
      
      {/* 1. Left Sidebar Tools */}
      <Toolbar
        brushType={brushType}
        setBrushType={(t) => startTransition(() => setBrushType(t))}
        textEffect={textEffect}
        setTextEffect={(e) => startTransition(() => setTextEffect(e))}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        textSize={textSize}
        setTextSize={setTextSize}
        canvasBg={canvasBg}
        setCanvasBg={setCanvasBg}
        soundVolume={soundVolume}
        setSoundVolume={handleVolumeChange}
        soundMuted={soundMuted}
        setSoundMuted={handleMutedChange}
        onClear={handleClear}
        onUndo={handleUndo}
        canUndo={canUndo}
      />

      {/* 2. Main Lab Workspace Panel */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000000] min-w-0">
        
        {/* Dynamic Horizontal Recorder bar */}
        <RecordingStatus
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          recordedVideoUrl={recordedVideoUrl}
          onDownload={handleDownloadVideo}
          recordingUnsupported={recordingUnsupported}
        />

        {/* Fonts Options Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-b-4 border-black px-6 py-2.5">
          
          {/* Typography selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-black" />
              Font di Scrittura:
            </span>
            <div className="flex gap-1.5 ml-1">
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  id={`font-${font.id}`}
                  onClick={() => setSelectedFont(font.id)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black border-2 border-black cursor-pointer transition-all focus:outline-none ${
                    selectedFont === font.id 
                      ? 'bg-[#FF8A00] text-black shadow-[2px_2px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  {font.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Preset color swatches directly visible near drawing */}
          <ColorPalette
            selectedColor={brushColor}
            onColorSelect={setBrushColor}
          />
        </div>

        {/* 3. The Interactive Drawing & Typewriters Playground */}
        <div 
          ref={containerRef} 
          onClick={() => {
            if (isTypingActive && hiddenInputRef.current) {
              hiddenInputRef.current.focus();
            }
          }}
          className="flex-1 w-full relative overflow-hidden cursor-crosshair bg-[#0b0f19]"
          style={{ backgroundColor: canvasBg }}
        >
          {/* Active Invisible Multilingual Input Bridge */}
          <input
            ref={hiddenInputRef}
            type="text"
            id="hidden-multilingual-input"
            onChange={handleInputChange}
            onKeyDown={handleHiddenInputKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionUpdate={handleCompositionUpdate}
            onCompositionEnd={handleCompositionEnd}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="absolute pointer-events-none text-transparent bg-transparent border-none outline-none focus:outline-none focus:ring-0"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y - textSize * 0.75}px`,
              width: '20px',
              height: `${textSize}px`,
              fontSize: `${textSize}px`,
              opacity: 0.01,
              caretColor: 'transparent',
              zIndex: 30,
            }}
          />

          {/* Floaty composition preview hud right where the user is currently typing */}
          {isTypingActive && composingText && (
            <div 
              id="ime-preview-popup"
              className="absolute pointer-events-none select-none text-[#FF007A] bg-white border-3 border-black rounded-2xl px-3 py-1.5 shadow-[4px_4px_0px_#000] text-lg font-black flex items-center gap-2 inline-flex whitespace-nowrap animate-bounce z-40"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y - textSize * 1.3}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-[10px] bg-[#FFDE03] px-1.5 py-0.5 font-black rounded-lg border-2 border-black text-black uppercase tracking-wider">IME:</span>
              <span>{composingText}</span>
              <span className="w-1.5 h-5 bg-[#FF007A] animate-pulse rounded"></span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            id="writing-canvas"
            onMouseDown={handlePointerStart}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerEnd}
            onMouseLeave={handlePointerEnd}
            onTouchStart={handlePointerStart}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerEnd}
            className="block w-full h-full select-none touch-none bg-transparent"
          />

          {/* Click hint backdrop on empty canvas */}
          {canvasEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center gap-3 max-w-sm bg-white p-5 border-3 border-black rounded-3xl shadow-[5px_5px_0px_#000]"
              >
                <div className="p-3.5 rounded-full bg-[#00E5FF] border-2 border-black shadow-[2px_2px_0px_#000] text-black">
                  <Sparkles className="w-6 h-6 text-black animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-wider">Lavagna Pronta!</h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-bold mt-1">
                    Traccia linee col mouse o touch.<br/>
                    Fai click ovunque e <strong>digita lettere, parole in italiano, o usa tastiere IME internazionali (Cinese/Giapponese)</strong>!
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Micro-Help Banner Trigger button of instructions */}
        <button
          type="button"
          id="btn-help-floating"
          onClick={() => setShowInstructions(true)}
          className="absolute bottom-5 right-5 p-3.5 rounded-full bg-[#00FF41] border-3 border-black hover:bg-emerald-400 text-black cursor-pointer transition-all shadow-[4px_4px_0px_#000] text-center"
          title="Mostra istruzioni"
        >
          <HelpCircle className="w-5 h-5 text-black" />
        </button>
      </div>

      {/* 4. Help & Fun Info Modal Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-black rounded-3xl w-full max-w-xl shadow-[8px_8px_0px_#000000] overflow-hidden text-black"
            >
              <div className="bg-[#FF007A] p-5 flex justify-between items-center text-white border-b-4 border-black">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">Ghiribizzo Pazzo 🎨🎹</h2>
                    <p className="text-[10px] text-yellow-300 font-extrabold uppercase tracking-wider mt-0.5">Laboratorio d'Arte Sonica e Scrittura</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-close-instructions-header"
                  onClick={() => setShowInstructions(false)}
                  className="p-1 px-2.5 rounded-lg bg-black border-2 border-black hover:bg-slate-900 text-white cursor-pointer transition-all font-black text-xs"
                >
                  X
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5 bg-white">
                
                <p className="text-xs text-slate-800 leading-relaxed font-bold">
                  Benvenuto in <strong>Ghiribizzo</strong>! Un'applicazione divertentissima che unisce il disegno a mano libera e la scrittura su tastiera in un'esperienza ricca di effetti speciali, <strong>suoni retro di macchine da scrivere</strong> sintetizzati all'istante e un <strong>registratore video</strong> integrato per salvare le tue pazze performance!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-1">
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border-2 border-black flex flex-col gap-2">
                    <h4 className="text-xs font-black text-[#FF007A] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF007A]" />
                      DISEGNO LIBERO
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-bold">
                      Scegli tra vari stili di pennello incredibili nel menu di sinistra: Neon che brilla, arcobaleni cromatici, vernice liquida che cola, o stelle geometriche!
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border-2 border-black flex flex-col gap-2">
                    <h4 className="text-xs font-black text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4 text-[#00E5FF]" />
                      TASTIERA PAZZA
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-bold font-sans">
                      Fai click sulla lavagna per posizionare il cursore ed <strong>inizia a digitare sulla tua tastiera fisica</strong>! Con gli effetti attivi, vedrai le tue parole fluttuare o precipitare a terra!
                    </p>
                  </div>

                </div>

                <div className="bg-[#FFDE03] rounded-2xl p-3.5 border-2 border-black flex items-start gap-2.5 shadow-[2px_2px_0px_#000]">
                  <AlertCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-[11px] text-black leading-relaxed font-extrabold">
                    <strong>Come Salvare la Performance in Video:</strong> Clicca sul pulsante rosso <strong>REGISTRA PERFORMANCE</strong> in alto, crea il tuo disegno, digita le tue parole, poi clicca su <strong>INTERROMPI</strong>. Potrai scaricare istantaneamente il file video ad alta definizione della tua creazione!
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
                  <motion.button
                    type="button"
                    id="btn-close-instructions-footer"
                    onClick={() => setShowInstructions(false)}
                    className="px-6 py-2 rounded-xl bg-[#00FF41] border-2 border-black text-xs font-black text-black shadow-[3px_3px_0px_#000] cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    COMINCIA A DIVERTIRTI COI SOCIAL!
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
