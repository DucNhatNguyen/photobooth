'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Photo } from '@/src/types';
import { downloadImage } from '@/src/utils/imageUtils';

interface PhotoGalleryProps {
  photos: Photo[];
  onDeletePhoto: (id: string) => void;
}

export default function PhotoGallery({ photos, onDeletePhoto }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p className="text-lg">Chưa có ảnh nào. Hãy chụp ảnh đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative group aspect-4/3 bg-gray-100 rounded-lg overflow-hidden shadow-lg"
        >
          <Image
            src={photo.url}
            alt={`Photo ${photo.id}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            unoptimized
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => downloadImage(photo.url, `photo-${photo.id}.png`)}
              className="p-3 bg-white rounded-full hover:bg-blue-500 hover:text-white transition-colors"
              title="Tải về"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            
            <button
              onClick={() => onDeletePhoto(photo.id)}
              className="p-3 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
              title="Xóa"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Photo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs">
              {new Date(photo.timestamp).toLocaleTimeString('vi-VN')}
            </p>
            {photo.filter && photo.filter !== 'none' && (
              <p className="text-white text-xs capitalize">{photo.filter}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
