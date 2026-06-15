declare module "threejs-components/build/cursors/tubes1.min.js" {
  type TubesCursorOptions = {
    tubes?: {
      colors?: string[];
      lights?: {
        intensity?: number;
        colors?: string[];
      };
    };
  };

  type TubesCursorInstance = {
    pointer?: {
      x: number;
      y: number;
      moved: boolean;
    };
    tubes?: {
      setColors(colors: string[]): void;
    };
  };

  const TubesCursor: (
    canvas: HTMLCanvasElement,
    options?: TubesCursorOptions
  ) => TubesCursorInstance;

  export default TubesCursor;
}
