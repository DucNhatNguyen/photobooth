'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Photo, FrameId } from '@/src/types';
import { createCollage, downloadImage } from '@/src/utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import FrameSelector from '@/src/components/FrameSelector';

interface CollageCreatorProps {
  photos: Photo[];
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  gridSize: { rows: number; cols: number };
  style: 'emoji' | 'polaroid' | 'modern' | 'classic';
  theme: string;
  bgColor: string;
}

const templates: Template[] = [
  {
    id: 'classic-2x2',
    name: 'Classic 2×2',
    description: 'Traditional 4-photo grid',
    gridSize: { rows: 2, cols: 2 },
    style: 'classic',
    theme: '🎨',
    bgColor: '#ffffff'
  },
  {
    id: 'polaroid-strip',
    name: 'Polaroid Strip',
    description: 'Vintage 1×4 strip',
    gridSize: { rows: 4, cols: 1 },
    style: 'polaroid',
    theme: '📷',
    bgColor: '#f8f6f0'
  },
  {
    id: 'birthday-oval',
    name: 'Birthday Oval',
    description: 'Celebration with balloons',
    gridSize: { rows: 2, cols: 2 },
    style: 'emoji',
    theme: '🎂',
    bgColor: '#fff4e6'
  },
  {
    id: 'checkered-3x3',
    name: 'Checkered 3×3',
    description: 'Black & white grid',
    gridSize: { rows: 3, cols: 3 },
    style: 'modern',
    theme: '◼️',
    bgColor: '#000000'
  },
  {
    id: 'lovely-sticker',
    name: 'Lovely Sticker',
    description: 'Cute circular frames',
    gridSize: { rows: 2, cols: 2 },
    style: 'emoji',
    theme: '💕',
    bgColor: '#ffe4f0'
  },
  {
    id: 'blue-birthday-strip',
    name: 'Blue Birthday',
    description: 'Happy celebration strip',
    gridSize: { rows: 1, cols: 4 },
    style: 'emoji',
    theme: '⭐',
    bgColor: '#e0f2ff'
  },
  {
    id: 'pink-vertical-6',
    name: 'Pink Vertical',
    description: 'Feminine 6-photo strip',
    gridSize: { rows: 6, cols: 1 },
    style: 'emoji',
    theme: '🌸',
    bgColor: '#fce7f3'
  },
  {
    id: 'fun-2x3',
    name: 'Fun 2×3',
    description: 'Playful 6-photo grid',
    gridSize: { rows: 2, cols: 3 },
    style: 'emoji',
    theme: '😄',
    bgColor: '#fef3c7'
  },
  {
    id: 'nature-hexagon',
    name: 'Nature Hexagon',
    description: 'Floral arrangement',
    gridSize: { rows: 2, cols: 3 },
    style: 'emoji',
    theme: '🌺',
    bgColor: '#ecfccb'
  },
  {
    id: 'cute-animals',
    name: 'Cute Animals',
    description: 'Adorable creatures',
    gridSize: { rows: 2, cols: 2 },
    style: 'emoji',
    theme: '🐰',
    bgColor: '#fef9e7'
  },
  {
    id: 'party-time',
    name: 'Party Time',
    description: 'Festive celebration',
    gridSize: { rows: 3, cols: 2 },
    style: 'emoji',
    theme: '🎉',
    bgColor: '#f3e8ff'
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean 2×3 layout',
    gridSize: { rows: 2, cols: 3 },
    style: 'modern',
    theme: '◻️',
    bgColor: '#f5f5f5'
  }
];

const availableEmojiSets = {
  feminine: ['💖', '💕', '🌸', '🌺', '🦋', '✨', '💫', '🌷', '🌹', '💝', '🎀', '🌼', '🌻', '💗', '🌈', '🦄', '🧚'],
  birthday: ['🎂', '🎉', '🎈', '🎁', '🎊', '🥳', '🎇', '🎆', '🍰', '🧁', '🎀', '🎵'],
  cute: ['🐰', '🐻', '🐱', '🐶', '🐼', '🐨', '🦊', '🐹', '🐥', '🦄', '🐙', '🦔'],
  fun: ['😄', '😎', '🤩', '😍', '🥰', '😘', '😜', '🤗', '😊', '🌟', '⭐', '💫'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🍀', '🌿', '🍃', '🌾', '🌵', '🌴']
};

export default function CollageCreator({ photos, onClose }: CollageCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [collageStyle, setCollageStyle] = useState<'emoji' | 'polaroid' | 'modern' | 'classic'>('emoji');
  const [selectedEmojiSet, setSelectedEmojiSet] = useState<keyof typeof availableEmojiSets>('feminine');
  const [selectedFrame, setSelectedFrame] = useState<FrameId>('none');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const maxSlots = selectedTemplate.gridSize.rows * selectedTemplate.gridSize.cols;

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setSelectedPhotos([]);
    setCollageStyle(template.style);
    setOrientation(template.gridSize.rows > template.gridSize.cols ? 'vertical' : 'horizontal');
  }, []);

  const handlePhotoToggle = useCallback((photo: Photo) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.some(p => p.id === photo.id);
      if (isSelected) {
        return prev.filter(p => p.id !== photo.id);
      } else {
        if (prev.length >= maxSlots) {
          return prev;
        }
        return [...prev, photo];
      }
    });
  }, [maxSlots]);

  const handleCreateCollage = async () => {
    if (selectedPhotos.length === 0) return;

    setIsGenerating(true);
    try {
      const imageUrls = selectedPhotos.map(p => p.url);
      const emojis = collageStyle === 'emoji' ? availableEmojiSets[selectedEmojiSet] : undefined;
      
      const dataUrl = await createCollage(imageUrls, selectedTemplate.gridSize, {
        padding: collageStyle === 'polaroid' ? 20 : 10,
        cornerRadius: collageStyle === 'modern' ? 15 : collageStyle === 'polaroid' ? 5 : 0,
        bgColor: selectedTemplate.bgColor,
        style: collageStyle,
        emojis,
        vertical: orientation === 'vertical',
        frame: selectedFrame,
      });

      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Error creating collage:', error);
      alert('Failed to create collage. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      downloadImage(previewUrl, `collage-${Date.now()}.png`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-linear-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Create Your Collage ✨</h2>
              <p className="text-purple-100 mt-1">Choose a template and select your photos</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📐 Choose a Template
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTemplate.id === template.id
                      ? 'border-purple-500 bg-linear-to-br from-purple-100 to-pink-100 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{template.theme}</span>
                    {selectedTemplate.id === template.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-purple-500 text-white rounded-full p-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {template.gridSize.rows}×{template.gridSize.cols}
                    </span>
                    <span className="capitalize">{template.style}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Slot Indicator */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Selected Photos: {selectedPhotos.length}/{maxSlots}
              </h3>
              {selectedPhotos.length > 0 && (
                <button
                  onClick={() => setSelectedPhotos([])}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxSlots }).map((_, index) => {
                const photo = selectedPhotos[index];
                return (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-lg border-2 ${
                      photo ? 'border-purple-500' : 'border-dashed border-gray-300'
                    } flex items-center justify-center relative overflow-hidden`}
                  >
                    {photo ? (
                      <>
                        <Image src={photo.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl text-gray-300">{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emoji Picker */}
          {collageStyle === 'emoji' && (
            <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm border border-purple-200">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  ✨ Emoji Decoration
                </h3>
                <motion.svg
                  animate={{ rotate: showEmojiPicker ? 180 : 0 }}
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {(Object.keys(availableEmojiSets) as Array<keyof typeof availableEmojiSets>).map((setName) => (
                        <button
                          key={setName}
                          onClick={() => setSelectedEmojiSet(setName)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedEmojiSet === setName
                              ? 'border-purple-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white/50 hover:border-purple-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{availableEmojiSets[setName][0]}</div>
                          <div className="text-xs capitalize font-medium text-gray-700">{setName}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1 bg-white/50 rounded-lg p-2">
                      {availableEmojiSets[selectedEmojiSet].map((emoji, idx) => (
                        <span key={idx} className="text-xl">{emoji}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Style and Orientation Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Style</h3>
              <div className="space-y-2">
                {(['emoji', 'polaroid', 'modern', 'classic'] as const).map((style) => (
                  <label key={style} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={style}
                      checked={collageStyle === style}
                      onChange={(e) => setCollageStyle(e.target.value as typeof style)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="capitalize text-sm">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Orientation</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="horizontal"
                    checked={orientation === 'horizontal'}
                    onChange={(e) => setOrientation(e.target.value as 'horizontal')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">Horizontal ↔️</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="vertical"
                    checked={orientation === 'vertical'}
                    onChange={(e) => setOrientation(e.target.value as 'vertical')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">Vertical ↕️</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2 shadow-sm border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1 px-2 pt-2">Frame</h3>
              <FrameSelector selectedFrame={selectedFrame} onFrameChange={setSelectedFrame} />
              <p className="text-[11px] text-gray-500 px-3 pb-2">Khung sẽ áp dụng cho từng ảnh trong collage.</p>
            </div>
          </div>

          {/* Photo Selection Grid */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📸 Select Your Photos
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {photos.map((photo) => {
                const isSelected = selectedPhotos.some(p => p.id === photo.id);
                const selectionIndex = selectedPhotos.findIndex(p => p.id === photo.id);
                
                return (
                  <motion.button
                    key={photo.id}
                    onClick={() => handlePhotoToggle(photo)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square rounded-xl overflow-hidden ${
                      isSelected ? 'ring-4 ring-purple-500' : 'ring-2 ring-gray-200'
                    }`}
                  >
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 25vw, 16vw" unoptimized />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-purple-500 text-white text-sm w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg"
                      >
                        {selectionIndex + 1}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex gap-4">
            <button
              onClick={handleCreateCollage}
              disabled={selectedPhotos.length === 0 || isGenerating}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
                selectedPhotos.length === 0 || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {isGenerating ? '⏳ Creating...' : '✨ Create Collage'}
            </button>
          </div>

          {/* Preview */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-purple-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🎨 Your Collage
              </h3>
              <div className="flex flex-col items-center gap-4">
                <CollagePreviewImage src={previewUrl} />
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  💾 Download Collage
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CollagePreviewImage({ src }: { src: string }) {
  const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!src) return;
    const i = new window.Image();
    i.src = src;
    i.onload = () => setDims({ w: i.naturalWidth, h: i.naturalHeight });
  }, [src]);

  if (!dims) {
    return (
      <div className="w-full max-w-3xl aspect-video bg-gray-100 rounded-lg animate-pulse" />
    );
  }
  return (
    <Image
      src={src}
      alt="Collage preview"
      width={dims.w}
      height={dims.h}
      className="rounded-lg shadow-md h-auto w-auto max-w-full"
      unoptimized
    />
  );
}
