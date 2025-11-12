'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WebcamCapture from '@/src/components/WebcamCapture';
import FilterSelector from '@/src/components/FilterSelector';
import FrameSelector from '@/src/components/FrameSelector';
import CollageCreator from '@/src/components/CollageCreator';
import GifCreator from '@/src/components/GifCreator';
import { Photo, FilterType, CaptureMode, FrameId, Overlay } from '@/src/types';
import OverlayEditor from '@/src/components/OverlayEditor';

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [selectedFrame, setSelectedFrame] = useState<FrameId>('none');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  const handlePhotoTaken = (photo: Photo) => {
    setPhotos((prev) => [photo, ...prev]);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
  <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📸 PhotoBooth
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="hidden md:inline">Ảnh đã chụp:</span>
              <span className="font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {photos.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Panel - Camera and tools */}
          <div className="space-y-4">
            {/* Mode Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex gap-2">
                <ModeButton
                  icon="📷"
                  label="Chụp ảnh"
                  isActive={captureMode === 'photo'}
                  onClick={() => setCaptureMode('photo')}
                />
                <ModeButton
                  icon="🖼️"
                  label="Collage"
                  isActive={captureMode === 'collage'}
                  onClick={() => setCaptureMode('collage')}
                />
                <ModeButton
                  icon="🎬"
                  label="GIF"
                  isActive={captureMode === 'gif'}
                  onClick={() => setCaptureMode('gif')}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <AnimatePresence mode="wait">
                {captureMode === 'photo' && (
                  <motion.div
                    key="photo"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="aspect-video">
                      <WebcamCapture
                        onPhotoTaken={handlePhotoTaken}
                        selectedFilter={selectedFilter}
                        selectedFrame={selectedFrame}
                        overlays={overlays}
                      />
                    </div>
                    <FilterSelector
                      selectedFilter={selectedFilter}
                      onFilterChange={setSelectedFilter}
                    />
                    <FrameSelector
                      selectedFrame={selectedFrame}
                      onFrameChange={setSelectedFrame}
                    />
                    {/* Overlay Editor */}
                    <div className="p-4">
                      <OverlayEditor overlays={overlays} onChange={setOverlays} title="Chữ & Sticker (áp dụng khi xuất)" />
                    </div>
                  </motion.div>
                )}

                {captureMode === 'collage' && (
                  <motion.div
                    key="collage"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[600px]"
                  >
                    <CollageCreator photos={photos} overlays={overlays} onClose={() => setCaptureMode('photo')} />
                  </motion.div>
                )}

                {captureMode === 'gif' && (
                  <motion.div
                    key="gif"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[600px]"
                  >
                    <GifCreator photos={photos} overlays={overlays} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel removed to expand main content as requested */}
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ModeButton({ icon, label, isActive, onClick }: ModeButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
        isActive
          ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="text-xl mr-2">{icon}</span>
      {label}
    </motion.button>
  );
}
