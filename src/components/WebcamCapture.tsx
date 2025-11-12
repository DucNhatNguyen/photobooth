'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo, FilterType, FrameId, Overlay, TextOverlay, ShapeOverlay } from '@/src/types';
import { applyFilterFrameAndOverlaysToImage } from '@/src/utils/imageUtils';

interface WebcamCaptureProps {
  onPhotoTaken: (photo: Photo) => void;
  selectedFilter: FilterType;
  selectedFrame: FrameId;
  overlays?: Overlay[];
}

export default function WebcamCapture({ onPhotoTaken, selectedFilter, selectedFrame, overlays = [] }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt của bạn không hỗ trợ camera. Vui lòng sử dụng trình duyệt khác hoặc cập nhật trình duyệt hiện tại.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCameraError(null))
      .catch((err) => {
        console.error('Camera error:', err);
        setCameraError(`Không thể truy cập camera. Chi tiết lỗi: ${err.message}`);
      });
  }, []);

  const capturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        // Flash effect
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 200);

  // Apply filter + frame + overlays
  const finalImage = await applyFilterFrameAndOverlaysToImage(imageSrc, selectedFilter, selectedFrame, overlays);

        const photo: Photo = {
          id: Date.now().toString(),
          url: finalImage,
          timestamp: Date.now(),
          filter: selectedFilter,
          frame: selectedFrame,
          overlays: overlays,
        };

        onPhotoTaken(photo);
      }
    }
    
    setIsCapturing(false);
  }, [onPhotoTaken, selectedFilter, selectedFrame, overlays]);

  const startCountdown = useCallback(() => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  }, [isCapturing, capturePhoto]);

  const captureQuick = useCallback(() => {
    if (isCapturing) return;
    setIsCapturing(true);
    capturePhoto();
  }, [isCapturing, capturePhoto]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden">
      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/png"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: 'user',
        }}
        className="w-full h-full object-cover"
        style={{
          filter: getFilterStyle(selectedFilter),
        }}
      />

      {/* Live Frame Overlay */}
      <FrameOverlay frame={selectedFrame} />

      {/* Live Overlays */}
      {overlays && overlays.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {overlays.map((ov) => (
            <div key={ov.id} className="absolute select-none" style={{ left: `${ov.x * 100}%`, top: `${ov.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
              { isTextOverlay(ov) ? (
                <span style={{
                  color: (ov as TextOverlay).color,
                  fontWeight: (ov as TextOverlay).bold ? 700 : 400,
                  fontSize: (ov as TextOverlay).fontSize,
                  textShadow: (ov as TextOverlay).shadowColor && (ov as TextOverlay).shadowBlur ? `0 0 ${(ov as TextOverlay).shadowBlur}px ${(ov as TextOverlay).shadowColor}` : undefined,
                }}>{(ov as TextOverlay).text}</span>
              ) : (
                <ShapeBadge ov={ov as ShapeOverlay} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white text-9xl font-bold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Effect */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white animate-flash" />
      )}

      {/* Capture Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        {/* Quick capture button */}
        <motion.button
          onClick={captureQuick}
          disabled={isCapturing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-blue-500 text-white shadow-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
          title="Chụp ngay"
        >
          ⚡
        </motion.button>
        
        {/* Main capture button with countdown */}
        <motion.button
          onClick={startCountdown}
          disabled={isCapturing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 shadow-xl hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
          title="Chụp với countdown 3-2-1"
        >
          <div className="w-16 h-16 rounded-full bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </motion.button>
      </div>

      {/* Hiển thị lỗi camera nếu có */}
      {cameraError && (
        <div className="absolute inset-0 bg-red-500 text-white flex items-center justify-center text-center p-4">
          {cameraError}
        </div>
      )}
    </div>
  );
}

function getFilterStyle(filter: FilterType): string {
  switch (filter) {
    case 'grayscale':
      return 'grayscale(100%)';
    case 'sepia':
      return 'sepia(100%)';
    case 'vintage':
      return 'sepia(50%) saturate(120%)';
    case 'warm':
      return 'saturate(120%) hue-rotate(-10deg)';
    case 'cool':
      return 'saturate(120%) hue-rotate(10deg)';
    case 'bright':
      return 'brightness(120%)';
    case 'contrast':
      return 'contrast(150%)';
    case 'none':
    default:
      return 'none';
  }
}

function ShapeBadge({ ov }: { ov: ShapeOverlay }) {
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
    default:
      return null;
  }
}

function isTextOverlay(ov: Overlay): ov is TextOverlay {
  return (ov as TextOverlay).type === 'text';
}

function FrameOverlay({ frame }: { frame: FrameId }) {
  if (frame === 'none') return null;
  // Overlay using simple CSS shapes
  switch (frame) {
    case 'polaroid':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[96%] h-[96%] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 border-white/95 rounded-xl" style={{ borderWidth: 16 }} />
            <div className="absolute left-0 right-0 bottom-0 h-[14%] bg-white/95 rounded-b-xl flex items-center justify-center text-gray-500 text-xs font-semibold tracking-wider">
              PhotoBooth
            </div>
          </div>
        </div>
      );
    case 'film':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-black/90" />
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-black/90" />
          {/* holes */}
          <div className="absolute left-5 top-3 bottom-3 flex flex-col justify-between">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-white/90" />
            ))}
          </div>
          <div className="absolute right-5 top-3 bottom-3 flex flex-col justify-between">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-white/90" />
            ))}
          </div>
        </div>
      );
    case 'neon':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-4 border-purple-500" style={{ boxShadow: '0 0 24px 8px rgba(167,139,250,0.65), inset 0 0 12px rgba(124,58,237,0.6)' }} />
        </div>
      );
    case 'gold':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-xl border-8" style={{ borderImage: 'linear-gradient(45deg,#c59d5f,#ffd700,#c59d5f) 1', borderStyle: 'solid' }} />
        </div>
      );
    case 'tape':
      return (
        <div className="absolute inset-0 pointer-events-none">
          {[
            'rotate-[-10deg] left-4 top-4',
            'rotate-[8deg] right-4 top-4',
            'rotate-[12deg] left-4 bottom-4',
            'rotate-[-7deg] right-4 bottom-4',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-28 h-4 bg-[#fff7d1] shadow-md`} style={{ border: '1px solid rgba(0,0,0,0.12)' }} />
          ))}
        </div>
      );
    case 'christmas':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[94%] h-[94%] rounded-xl border-8"
            style={{ borderImage: 'linear-gradient(45deg,#ef4444,#22c55e) 1', borderStyle: 'solid' }}
          />
          {/* snow dots corners */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/90"
                style={{
                  width: 6 + (i % 3),
                  height: 6 + (i % 3),
                  left: `${(i * 7) % 100}%`,
                  top: i % 2 === 0 ? '2%' : 'auto',
                  bottom: i % 2 !== 0 ? '2%' : 'auto',
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        </div>
      );
    case 'tet':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-lg border-10 border-red-600" />
          <div className="absolute inset-[3%] rounded-lg border-4 border-yellow-400" />
          {/* corner dots */}
          <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-yellow-400" />
          <div className="absolute right-4 top-4 w-3 h-3 rounded-full bg-yellow-400" />
          <div className="absolute left-4 bottom-4 w-3 h-3 rounded-full bg-yellow-400" />
          <div className="absolute right-4 bottom-4 w-3 h-3 rounded-full bg-yellow-400" />
        </div>
      );
    case 'birthday':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[3%] rounded-xl border-4 border-purple-600" />
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                background: ['#ef4444','#f59e0b','#10b981','#3b82f6','#eab308','#a855f7'][i % 6],
                width: 6 + (i % 3),
                height: 6 + (i % 3),
                left: `${(i * 9) % 100}%`,
                top: i % 2 === 0 ? '1%' : 'auto',
                bottom: i % 2 !== 0 ? '1%' : 'auto',
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      );
    case 'wedding':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 0 120px rgba(255,255,255,0.35)' }} />
          <div className="w-[95%] h-[95%] rounded-xl border-4" style={{ borderImage: 'linear-gradient(45deg,#c59d5f,#ffd700,#c59d5f) 1', borderStyle: 'solid' }} />
        </div>
      );
    case 'pastel-1':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-8" style={{ borderImage: 'linear-gradient(45deg,#fbcfe8,#fde68a,#bfdbfe,#ddd6fe) 1', borderStyle: 'solid' }} />
        </div>
      );
    case 'pastel-2':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-8 border-rose-400" />
          <div className="absolute inset-[3%] rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,237,213,0.6), rgba(254,215,170,0.6))' }} />
        </div>
      );
    case 'ocean':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-8" style={{ borderImage: 'linear-gradient(180deg,#60a5fa,#14b8a6) 1', borderStyle: 'solid' }} />
          <div className="absolute left-[3%] right-[3%] bottom-[3%] h-6 opacity-70" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 8px, transparent 8px 16px)' }} />
        </div>
      );
    case 'school':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[3%] rounded-lg bg-white/70" />
          <div className="absolute inset-[3%] rounded-lg" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(59,130,246,0.35) 1px, transparent 1px)', backgroundSize: '100% 12px' }} />
          <div className="absolute left-[6%] top-[6%] bottom-[6%] w-0.5 bg-red-400/50" />
          {['-8deg','10deg','8deg','-10deg'].map((rot, i) => (
            <div key={i} className="absolute w-16 h-3 bg-[#fefcbf] border border-black/10 shadow-sm" style={{ transform: `rotate(${rot})`, ...(i===0?{left:'4%',top:'4%'}:i===1?{right:'4%',top:'4%'}:i===2?{left:'4%',bottom:'4%'}:{right:'4%',bottom:'4%'}) }} />
          ))}
        </div>
      );
    case 'bubble':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-4 border-pink-400/60" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{ width: 12 + (i%6)*2, height: 12 + (i%6)*2, left: `${(i*13)%100}%`, top: i%2? '4%':'auto', bottom: i%2? 'auto':'4%', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(244,114,182,0.45))' }} />
          ))}
        </div>
      );
    case 'sticker':
      return (
        <div className="absolute inset-0 pointer-events-none">
          {['✨','💜','🌈','📸','⭐','🎀','🍓','🦄','🌸','🎈'].map((e,i)=> (
            <div key={i} className="absolute text-xl" style={{ left: `${(i*9)%100}%`, top: i%2? '3%':'auto', bottom: i%2? 'auto':'3%', transform: `rotate(${(i%5-2)*5}deg)` }}>{e}</div>
          ))}
          <div className="absolute inset-[3%] rounded-2xl border-4 border-indigo-500/60" />
        </div>
      );
    case 'comic':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[3%] rounded-xl border-4 border-slate-800/50" />
          <div className="absolute left-4 top-4 w-10 h-10 bg-orange-500/70 shadow-lg" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <div className="absolute right-4 bottom-4 w-12 h-12 bg-violet-500/70 shadow-lg" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        </div>
      );
    case 'flower':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-8 border-emerald-500/60" />
          {['left-6 top-6','right-6 top-6','left-6 bottom-6','right-6 bottom-6'].map((pos,i)=> (
            <div key={i} className={`absolute ${pos}`}>
              <div className="w-12 h-12 rounded-full bg-pink-300/70 absolute" style={{ transform: 'translate(8px,0)' }} />
              <div className="w-12 h-12 rounded-full bg-blue-300/70 absolute" style={{ transform: 'translate(-8px,0)' }} />
              <div className="w-12 h-12 rounded-full bg-green-300/70 absolute" style={{ transform: 'translate(0,8px)' }} />
              <div className="w-12 h-12 rounded-full bg-yellow-300/70 absolute" style={{ transform: 'translate(0,-8px)' }} />
            </div>
          ))}
        </div>
      );
    case 'hearts':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-4 border-pink-500" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-pink-500" style={{ left: `${(i*11)%100}%`, top: i%2? '4%':'auto', bottom: i%2? 'auto':'4%', transform: `rotate(${(i%5-2)*8}deg)` }}>💖</div>
          ))}
        </div>
      );
    case 'sparkle':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-8" style={{ borderImage: 'linear-gradient(45deg,#f472b6,#fb7185) 1', borderStyle: 'solid' }} />
          {Array.from({ length: 26 }).map((_, i) => (
            <div key={i} className="absolute text-white" style={{ left: `${(i*13)%100}%`, top: i%2? '3%':'auto', bottom: i%2? 'auto':'3%' }}>✨</div>
          ))}
        </div>
      );
    case 'ribbon':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[3%] rounded-2xl border-8 border-pink-400/80" />
          {['-25deg','25deg','-155deg','155deg'].map((rot, i) => (
            <div key={i} className="absolute w-20 h-5 bg-pink-400" style={{ transform: `rotate(${rot})`, ...(i===0?{left:'5%',top:'5%'}:i===1?{right:'5%',top:'5%'}:i===2?{left:'5%',bottom:'5%'}:{right:'5%',bottom:'5%'}) }} />
          ))}
        </div>
      );
    case 'candy':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[94%] h-[94%] rounded-2xl border-12 border-white" />
          <div className="absolute inset-[3%] rounded-2xl" style={{ background: 'repeating-linear-gradient(45deg,#fb7185 0 10px, transparent 10px 20px)' }} />
        </div>
      );
    case 'blossom':
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[3%] rounded-2xl border-4 border-pink-500/70" />
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="absolute w-3 h-2 rounded-full bg-pink-300/70" style={{ left: `${(i*9)%100}%`, top: i%2? '4%':'auto', bottom: i%2? 'auto':'4%', transform: `rotate(${(i%7-3)*10}deg)` }} />
          ))}
        </div>
      );
    case 'kawaii':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[92%] h-[92%] rounded-4xl border-16 border-rose-500" />
          {['🩷','✨','🍑','🐰','🌸','🎀','🩷','✨','🌸','🎀'].map((e,i)=> (
            <div key={i} className="absolute text-2xl" style={{ left: `${(i*10)%100}%`, top: i%2? '3%':'auto', bottom: i%2? 'auto':'3%' }}>{e}</div>
          ))}
        </div>
      );
  }
}
