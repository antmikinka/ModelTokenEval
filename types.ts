export interface ParsedFile {
  fileName: string;
  modelName: string;
  promptVersion: string;
  iteration: number;
  inputMode: string;
  duration: number; // in seconds
  promptTokens: number;
  thinkingTokens: number;
  responseTokens: number;
  totalTokens: number;
  isValidJson: boolean;
  hasThinking: boolean;
  content: string;
}

export interface MatrixCell {
  files: ParsedFile[];
}

export type MatrixData = Record<string, Record<string, MatrixCell>>;

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}