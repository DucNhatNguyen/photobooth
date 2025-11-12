'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo, FilterType, FrameId } from '@/src/types';
import { applyFilterAndFrameToImage } from '@/src/utils/imageUtils';

interface WebcamCaptureProps {
  onPhotoTaken: (photo: Photo) => void;
  selectedFilter: FilterType;
  selectedFrame: FrameId;
}

export default function WebcamCapture({ onPhotoTaken, selectedFilter, selectedFrame }: WebcamCaptureProps) {
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

        // Apply filter + frame
        const finalImage = await applyFilterAndFrameToImage(imageSrc, selectedFilter, selectedFrame);

        const photo: Photo = {
          id: Date.now().toString(),
          url: finalImage,
          timestamp: Date.now(),
          filter: selectedFilter,
          frame: selectedFrame,
        };

        onPhotoTaken(photo);
      }
    }
    
    setIsCapturing(false);
  }, [onPhotoTaken, selectedFilter, selectedFrame]);

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
  }
}
