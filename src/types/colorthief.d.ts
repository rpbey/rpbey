declare module 'colorthief' {
  export default class ColorThief {
    getColor(img: HTMLImageElement | null, quality?: number): [number, number, number] | null;
    getPalette(img: HTMLImageElement | null, colorCount?: number, quality?: number): [number, number, number][];
  }
}
