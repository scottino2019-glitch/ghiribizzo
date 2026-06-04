/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Square, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface RecordingStatusProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordedVideoUrl: string | null;
  onDownload: () => void;
  recordingUnsupported: boolean;
}

export const RecordingStatus: React.FC<RecordingStatusProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  recordedVideoUrl,
  onDownload,
  recordingUnsupported,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-[#FFDE03] border-b-4 border-black px-6 py-3.5 text-black select-none">
      
      {/* Recording controls */}
      <div className="flex items-center gap-3">
        {recordingUnsupported ? (
          <div className="text-black bg-red-400 rounded-xl px-4 py-2 border-3 border-black font-black text-xs">
            ⚠️ Capture non supportato!
          </div>
        ) : !isRecording ? (
          <motion.button
            type="button"
            id="btn-start-record"
            onClick={onStartRecording}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF0000] border-3 border-black text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#00]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Video className="w-4 h-4 text-white animate-pulse" />
            REGISTRA PERFORMANCE 🎥
          </motion.button>
        ) : (
          <motion.button
            type="button"
            id="btn-stop-record"
            onClick={onStopRecording}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white border-3 border-black text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Square className="w-4 h-4 text-[#FF0000] fill-[#FF0000]" />
            INTERROMPI ⏹️
          </motion.button>
        )}
      </div>

      {/* Recording state / Timer info */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-3 bg-white border-3 border-black px-4 py-1.5 rounded-full shadow-[2px_2px_0px_#000]"
          >
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
            </span>
            <span className="text-black font-black text-xs tracking-widest uppercase">
              REC: {formatTime(seconds)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download box on recorded finished */}
      <AnimatePresence>
        {recordedVideoUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-3 bg-[#00FF41] border-3 border-black rounded-xl px-4 py-1.5 ml-auto shadow-[3px_3px_0px_#000]"
          >
            <div className="flex items-center gap-1.5 text-black font-black text-xs text-nowrap">
              <CheckCircle2 className="w-4 h-4 text-black" />
              CAPOLAVORO GENERATO!
            </div>
            
            <motion.button
              type="button"
              id="btn-download-record"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-lg text-xs font-black text-black cursor-pointer hover:bg-slate-50 transition-all shadow-[1px_1px_0px_#000]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-3.5 h-3.5 text-black" />
              Scarica Video (WeBM)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative tip */}
      {!isRecording && !recordedVideoUrl && (
        <div className="hidden lg:flex items-center gap-1.5 ml-auto text-black font-extrabold text-xs">
          <Sparkles className="w-4 h-4 text-[#FF007A]" />
          <span>Fai clic sulla lavagna, scrivi con la tastiera e disegna all'impazzata!</span>
        </div>
      )}

    </div>
  );
};

