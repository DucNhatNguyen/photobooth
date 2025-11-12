'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Photo, FrameId, Overlay } from '@/src/types';
import { downloadImage } from '@/src/utils/imageUtils';
import gifshot from 'gifshot';
import FrameSelector from '@/src/components/FrameSelector';
import { applyFilterFrameAndOverlaysToImage } from '@/src/utils/imageUtils';
import Image from 'next/image';

interface GifCreatorProps {
  photos: Photo[];
  overlays?: Overlay[];
}

export default function GifCreator({ photos, overlays = [] }: GifCreatorProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [gifImage, setGifImage] = useState<string | null>(null);
  const [gifDims, setGifDims] = useState<{ w: number; h: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [gifDelay, setGifDelay] = useState(0.5); // seconds
  const [selectedFrame, setSelectedFrame] = useState<FrameId>('none');

  const togglePhotoSelection = useCallback((photo: Photo) => {
    setSelectedPhotos((prev) => {
      const isSelected = prev.find((p) => p.id === photo.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== photo.id);
      } else {
        return [...prev, photo];
      }
    });
  }, []);

  const createGif = useCallback(async () => {
    if (selectedPhotos.length < 2) return;

    setIsCreating(true);
    // Optionally apply selected frame and overlays to each frame of GIF
    let imageUrls = selectedPhotos.map((p) => p.url);
    if (selectedFrame !== 'none') {
      try {
        imageUrls = await Promise.all(
          imageUrls.map((url) => applyFilterFrameAndOverlaysToImage(url, 'none', selectedFrame, overlays))
        );
      } catch (e) {
        console.warn('Could not apply frame to GIF frames:', e);
      }
    }

    gifshot.createGIF(
      {
        images: imageUrls,
        gifWidth: 640,
        gifHeight: 480,
        interval: gifDelay,
        numFrames: selectedPhotos.length,
        frameDuration: Math.round(gifDelay * 10),
      },
      (obj) => {
        if (!obj.error) {
          setGifImage(obj.image || null);
        } else {
          console.error('Error creating GIF:', obj.errorMsg);
          alert('Có lỗi khi tạo GIF. Vui lòng thử lại!');
        }
        setIsCreating(false);
      }
    );
  }, [selectedPhotos, gifDelay, selectedFrame, overlays]);

  const resetGif = useCallback(() => {
    setGifImage(null);
    setSelectedPhotos([]);
    setGifDims(null);
  }, []);

  useEffect(() => {
    if (!gifImage) return;
    const i = new window.Image();
    i.src = gifImage;
    i.onload = () => setGifDims({ w: i.naturalWidth, h: i.naturalHeight });
  }, [gifImage]);

  if (photos.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-lg">Cần ít nhất 2 ảnh để tạo GIF!</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Settings */}
      {!gifImage && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Frame cho GIF</h3>
            <FrameSelector selectedFrame={selectedFrame} onFrameChange={setSelectedFrame} />
            <p className="text-[11px] text-gray-500 px-1">Nếu chọn, khung sẽ áp dụng lên từng khung hình của GIF.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Tốc độ (delay giữa các frame):
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={gifDelay}
                onChange={(e) => setGifDelay(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-16">
                {gifDelay}s
              </span>
            </div>
          </div>

          {/* Photo Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Chọn ảnh (theo thứ tự - {selectedPhotos.length} ảnh):
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map((photo) => {
                const isSelected = selectedPhotos.find((p) => p.id === photo.id);
                const selectedIndex = selectedPhotos.findIndex((p) => p.id === photo.id);

                return (
                  <motion.button
                    key={photo.id}
                    onClick={() => togglePhotoSelection(photo)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                      isSelected
                        ? 'border-green-500 shadow-lg'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`Photo ${photo.id}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 16vw"
                      className="object-cover"
                      unoptimized
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedIndex + 1}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!gifImage ? (
        <motion.button
          onClick={createGif}
          disabled={selectedPhotos.length < 2 || isCreating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-linear-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? '🎬 Đang tạo GIF...' : '🎬 Tạo GIF'}
        </motion.button>
      ) : (
        <div className="space-y-4">
          {/* GIF Preview */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            {gifDims ? (
              <Image src={gifImage} alt="GIF" width={gifDims.w} height={gifDims.h} className="rounded-lg h-auto w-auto max-w-full" unoptimized />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              onClick={() => downloadImage(gifImage, `animated-${Date.now()}.gif`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              📥 Tải về
            </motion.button>
            <motion.button
              onClick={resetGif}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              🔄 Tạo mới
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
