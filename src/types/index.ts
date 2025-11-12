export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  filter?: FilterType;
  frame?: FrameId;
  overlays?: Overlay[]; // optional overlays applied at capture/export time
}

export type FilterType = 
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'vintage'
  | 'warm'
  | 'cool'
  | 'bright'
  | 'contrast';

export type CaptureMode = 'photo' | 'collage' | 'gif';

export interface CollageLayout {
  id: string;
  name: string;
  gridSize: { rows: number; cols: number };
  slots: number;
}

// Frames for photobooth overlay
export type FrameId =
  | 'none'
  | 'polaroid'
  | 'film'
  | 'neon'
  | 'gold'
  | 'tape'
  | 'christmas'
  | 'tet'
  | 'birthday'
  | 'wedding'
  // Pastel/sticker styles
  | 'pastel-1'
  | 'pastel-2'
  | 'ocean'
  | 'school'
  | 'bubble'
  | 'sticker'
  | 'comic'
  | 'flower'
  // Pink vibrant set
  | 'hearts'
  | 'sparkle'
  | 'ribbon'
  | 'candy'
  | 'blossom'
  | 'kawaii';

// --- Overlays (text/sticker) -------------------------------------------------

export type Overlay = TextOverlay | ShapeOverlay;

interface BaseOverlay {
  id: string;
  x: number; // normalized 0..1 (left)
  y: number; // normalized 0..1 (top)
  rotation?: number; // degrees
  opacity?: number; // 0..1
}

export interface TextOverlay extends BaseOverlay {
  type: 'text';
  text: string;
  fontFamily?: string; // e.g., 'sans-serif'
  fontSize: number; // px relative to canvas width
  color: string; // CSS color
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  outlineColor?: string;
  outlineWidth?: number; // px
  shadowColor?: string;
  shadowBlur?: number; // px
}

export interface ShapeOverlay extends BaseOverlay {
  type: 'shape';
  shape: 'heart' | 'star' | 'sparkle';
  size: number; // px relative to canvas width
  fill: string;
  stroke?: string;
  strokeWidth?: number; // px
}

// --- Collage Template identifiers -------------------------------------------

export type TemplateId = 'dual-strip-pink' | 'curved-pastel-board' | 'sticker-sheet';
