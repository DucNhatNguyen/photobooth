declare module 'gifshot' {
  export interface GifshotOptions {
    images?: string[];
    gifWidth?: number;
    gifHeight?: number;
    interval?: number;
    numFrames?: number;
    frameDuration?: number;
    sampleInterval?: number;
    numWorkers?: number;
  }

  export interface GifshotCallback {
    (obj: { error: boolean; errorCode?: string; errorMsg?: string; image?: string }): void;
  }

  export function createGIF(
    options: GifshotOptions,
    callback: GifshotCallback
  ): void;
}
