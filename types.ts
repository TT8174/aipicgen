export enum SketchStyle {
  PENCIL = '铅笔素描',
  CHARCOAL = '炭笔画',
  INK = '钢笔/墨水',
  MINIMALIST = '极简线条',
  STIPPLE = '点画风格',
  CROSSHATCH = '交叉排线'
}

export enum LineWeight {
  THIN = '细线条 / 精细',
  MEDIUM = '标准 / 平衡',
  THICK = '粗线条 / 加粗'
}

export interface SketchSettings {
  style: SketchStyle;
  lineWeight: LineWeight;
  darkness: number; // 1-100
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  generatedImage: string | null;
}