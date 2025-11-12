export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  filter?: FilterType;
  frame?: FrameId;
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
  | 'wedding';
