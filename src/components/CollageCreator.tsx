"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Photo, FrameId, Overlay } from "@/src/types";
import { createCollage, downloadImage } from "@/src/utils/imageUtils";

interface CollageCreatorProps {
  photos: Photo[];
  overlays?: Overlay[];
  onClose: () => void;
}

type CollageStyle = "emoji" | "polaroid" | "modern" | "classic";

interface TemplateCfg {
  id: string;
  name: string;
  description: string;
  gridSize: { rows: number; cols: number };
  style: CollageStyle;
  cellAspect: "landscape" | "portrait";
}

const templates: TemplateCfg[] = [
  // Chiều ngang (landscape cells): 2 rows x N cols
  { id: "h-2x2", name: "2 hàng x 2 cột (ngang)", description: "Lưới 2 hàng x 2 cột", gridSize: { rows: 2, cols: 2 }, style: "classic", cellAspect: "landscape" },
  { id: "h-2x3", name: "2 hàng x 3 cột (ngang)", description: "Lưới 2 hàng x 3 cột", gridSize: { rows: 2, cols: 3 }, style: "classic", cellAspect: "landscape" },
  { id: "h-2x4", name: "2 hàng x 4 cột (ngang)", description: "Lưới 2 hàng x 4 cột", gridSize: { rows: 2, cols: 4 }, style: "classic", cellAspect: "landscape" },
  // Chiều dọc (portrait cells): M rows x 2 cols
  { id: "v-2x2", name: "2 hàng x 2 cột (dọc)", description: "Lưới 2 hàng x 2 cột", gridSize: { rows: 2, cols: 2 }, style: "classic", cellAspect: "portrait" },
  { id: "v-3x2", name: "3 hàng x 2 cột (dọc)", description: "Lưới 3 hàng x 2 cột", gridSize: { rows: 3, cols: 2 }, style: "classic", cellAspect: "portrait" },
  { id: "v-4x2", name: "4 hàng x 2 cột (dọc)", description: "Lưới 4 hàng x 2 cột", gridSize: { rows: 4, cols: 2 }, style: "classic", cellAspect: "portrait" },
];

const availableEmojiSets = {
  cute: ["✨", "💖", "🎀", "🌸", "⭐", "🍓", "🦄", "💜", "🌈", "📸"],
  sweet: ["🍬", "🍭", "🍩", "🍓", "🧁", "🍒"],
  party: ["🎉", "🎈", "🎊", "🥳", "🎵", "✨"],
  animals: ["🐶", "🐱", "🐰", "🐻", "🦊", "🐼"],
};

export default function CollageCreator({ photos, overlays = [], onClose }: CollageCreatorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCfg>(templates[0]);
  const [collageStyle, setCollageStyle] = useState<CollageStyle>(templates[0].style);
  const [selectedFrame, setSelectedFrame] = useState<FrameId>("none");
  const [title, setTitle] = useState<string>("");
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiSet, setSelectedEmojiSet] = useState<keyof typeof availableEmojiSets>("cute");
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const maxSlots = selectedTemplate.gridSize.rows * selectedTemplate.gridSize.cols;

  const handleTemplateSelect = useCallback((tpl: TemplateCfg) => {
    setSelectedTemplate(tpl);
    setCollageStyle(tpl.style);
  }, []);

  const handlePhotoToggle = useCallback(
    (photo: Photo) => {
      setSelectedPhotos((prev) => {
        const exists = prev.some((p) => p.id === photo.id);
        if (exists) return prev.filter((p) => p.id !== photo.id);
        // Cap selection to available slots in the chosen grid
        if (prev.length >= maxSlots) return prev;
        return [...prev, photo];
      });
    },
    [maxSlots]
  );

  const handleCreateCollage = useCallback(async () => {
    if (selectedPhotos.length === 0) return;
    setIsGenerating(true);
    try {
      const images = selectedPhotos.map((p) => p.url);
      const layout = selectedTemplate.gridSize;
      // Choose cell size by template aspect (4:3 landscape, 3:4 portrait)
      const base = 480;
      const cellWidth = selectedTemplate.cellAspect === "landscape" ? base : Math.round(base * 0.75);
      const cellHeight = selectedTemplate.cellAspect === "landscape" ? Math.round(base * 0.75) : base;

      const dataUrl = await createCollage(images, layout, {
        style: collageStyle,
        emojis: availableEmojiSets[selectedEmojiSet],
        frame: selectedFrame,
        overlays,
        title: title.trim() || undefined,
        cellWidth,
        cellHeight,
        padding: 12,
        cornerRadius: 24,
        bgColor: "#fff0f5",
        mask: "rounded",
      });
      setPreviewUrl(dataUrl);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPhotos, selectedTemplate, collageStyle, selectedEmojiSet, selectedFrame, overlays, title]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    downloadImage(previewUrl, `collage-${Date.now()}.png`);
  }, [previewUrl]);

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Controls and selection */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">📐 Chọn khung template</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTemplate.id === template.id
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
                    }`}
                    title={`${template.gridSize.cols}x${template.gridSize.rows} - ${template.cellAspect === "landscape" ? "ngang" : "dọc"}`}
                  >
                    <div className="mb-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${template.gridSize.cols}, minmax(0,1fr))` }}>
                      {Array.from({ length: template.gridSize.rows * template.gridSize.cols }).map((_, i) => (
                        <div key={i} className="h-5 rounded bg-gray-100 border border-gray-200" />
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-800 text-xs">{template.name}</h4>
                    <p className="text-[11px] text-gray-600 mt-1">{template.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Slot Indicator */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Selected Photos: {selectedPhotos.length}/{maxSlots}</h3>
                {selectedPhotos.length > 0 && (
                  <button onClick={() => setSelectedPhotos([])} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.max(maxSlots, selectedPhotos.length || maxSlots) }).map((_, index) => {
                  const photo = selectedPhotos[index];
                  return (
                    <div
                      key={index}
                      className={`w-16 h-16 rounded-lg border-2 ${photo ? "border-purple-500" : "border-dashed border-gray-300"} flex items-center justify-center relative overflow-hidden`}
                    >
                      {photo ? (
                        <>
                          <Image src={photo.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                          <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{index + 1}</div>
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
            {collageStyle === "emoji" && (
              <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 shadow-sm border border-purple-200">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-full flex items-center justify-between text-left">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">✨ Emoji Decoration</h3>
                  <motion.svg animate={{ rotate: showEmojiPicker ? 180 : 0 }} className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 grid grid-cols-5 gap-2">
                        {(Object.keys(availableEmojiSets) as Array<keyof typeof availableEmojiSets>).map((setName) => (
                          <button
                            key={setName}
                            onClick={() => setSelectedEmojiSet(setName)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedEmojiSet === setName ? "border-purple-500 bg-white shadow-md" : "border-gray-200 bg-white/50 hover:border-purple-300"
                            }`}
                          >
                            <div className="text-2xl mb-1">{availableEmojiSets[setName][0]}</div>
                            <div className="text-xs capitalize font-medium text-gray-700">{setName}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 bg-white/50 rounded-lg p-2">
                        {availableEmojiSets[selectedEmojiSet].map((emoji, idx) => (
                          <span key={idx} className="text-xl">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Compact selects for Style / Frame (Orientation removed) */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Style</label>
                  <select
                    value={collageStyle}
                    onChange={(e) => setCollageStyle(e.target.value as CollageStyle)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="emoji">Emoji</option>
                    <option value="polaroid">Polaroid</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Frame</label>
                  <select
                    value={selectedFrame}
                    onChange={(e) => setSelectedFrame(e.target.value as FrameId)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {frameOptions.map((f) => (
                      <option key={f.id} value={f.id}>{`${f.icon} ${f.name}`}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">Áp dụng khung cho từng ảnh trong collage.</p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề (tuỳ chọn)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Ví dụ: Besties / Happy Day"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 mt-1">Sẽ hiển thị trên template phù hợp (dual strip/footer, ribbon top...).</p>
            </div>

            {/* Photo selection trigger */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">📸 Ảnh đã chọn</h3>
              <button
                onClick={() => setShowPhotoPicker(true)}
                className="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg"
              >
                Chọn ảnh
              </button>
            </div>

            {/* Photo Picker Modal */}
            <AnimatePresence>
              {showPhotoPicker && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowPhotoPicker(false)} />
                  <motion.div
                    className="relative bg-white rounded-2xl shadow-2xl w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden border border-purple-200"
                    initial={{ scale: 0.95, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Chọn ảnh từ thư viện ({photos.length})</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPhotos([])}
                            className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            Bỏ chọn hết
                          </button>
                          <button
                            onClick={() => setShowPhotoPicker(false)}
                            className="px-4 py-2 text-sm rounded-lg bg-linear-to-r from-purple-600 to-pink-600 text-white"
                          >
                            Xong
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 overflow-auto max-h-[calc(85vh-64px)]">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {photos.map((photo) => {
                          const isSelected = selectedPhotos.some((p) => p.id === photo.id);
                          const selectionIndex = selectedPhotos.findIndex((p) => p.id === photo.id);
                          return (
                            <motion.button
                              key={photo.id}
                              onClick={() => handlePhotoToggle(photo)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative aspect-square rounded-xl overflow-hidden ${isSelected ? "ring-4 ring-purple-500" : "ring-2 ring-gray-200"}`}
                            >
                              <Image src={photo.url} alt="" fill className="object-cover" sizes="(max-width: 1024px) 25vw, 16vw" unoptimized />
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 bg-purple-500 text-white text-sm w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                                  {selectionIndex + 1}
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action */}
            <div className="flex gap-4">
              <button
                onClick={handleCreateCollage}
                disabled={selectedPhotos.length === 0 || isGenerating}
                className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedPhotos.length === 0 || isGenerating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                {isGenerating ? "⏳ Creating..." : "✨ Create Collage"}
              </button>
            </div>
          </div>

          {/* Right: Sticky preview */}
          <div>
            <div className="sticky top-4">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">🎨 Preview</h3>
                <div className="flex flex-col items-center gap-4">
                  {previewUrl ? (
                    <CollagePreviewImage src={previewUrl} />
                  ) : (
                    <div className="w-full max-w-3xl aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                      Nhấn "Create Collage" để xem preview tại đây
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={handleCreateCollage}
                      disabled={selectedPhotos.length === 0 || isGenerating}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        selectedPhotos.length === 0 || isGenerating
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
                      }`}
                    >
                      {isGenerating ? "⏳ Đang tạo lại..." : "↻ Tạo/ cập nhật preview"}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!previewUrl}
                      className={`px-6 py-3 rounded-lg font-semibold ${
                        previewUrl
                          ? "bg-linear-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    return <div className="w-full max-w-3xl aspect-video bg-gray-100 rounded-lg animate-pulse" />;
  }
  return <Image src={src} alt="Collage preview" width={dims.w} height={dims.h} className="rounded-lg shadow-md h-auto w-auto max-w-full" unoptimized />;
}

// Frame options for the compact select
const frameOptions: { id: FrameId; name: string; icon: string }[] = [
  { id: "none", name: "Không khung", icon: "🪄" },
  { id: "polaroid", name: "Polaroid", icon: "📷" },
  { id: "film", name: "Film", icon: "🎞️" },
  { id: "neon", name: "Neon", icon: "💡" },
  { id: "gold", name: "Gold", icon: "🏅" },
  { id: "tape", name: "Tape", icon: "📌" },
  { id: "christmas", name: "Noel", icon: "🎄" },
  { id: "tet", name: "Tết", icon: "🧧" },
  { id: "birthday", name: "Sinh nhật", icon: "🎉" },
  { id: "wedding", name: "Wedding", icon: "💍" },
  { id: "pastel-1", name: "Pastel 1", icon: "🌈" },
  { id: "pastel-2", name: "Pastel 2", icon: "🍑" },
  { id: "ocean", name: "Ocean", icon: "🌊" },
  { id: "school", name: "School", icon: "📒" },
  { id: "bubble", name: "Bubble", icon: "🫧" },
  { id: "sticker", name: "Sticker", icon: "💜" },
  { id: "comic", name: "Comic", icon: "💥" },
  { id: "flower", name: "Flower", icon: "🌸" },
  { id: "hearts", name: "Hearts", icon: "💖" },
  { id: "sparkle", name: "Sparkle", icon: "✨" },
  { id: "ribbon", name: "Ribbon", icon: "🎀" },
  { id: "candy", name: "Candy", icon: "🍬" },
  { id: "blossom", name: "Blossom", icon: "🌺" },
  { id: "kawaii", name: "Kawaii", icon: "🩷" },
];
