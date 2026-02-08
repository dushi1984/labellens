export interface LabelData {
  title: string | null;
  model: string | null;
  color: string | null;
  size: string | null;
  spn: string | null;
  barcode_type: string | null;
  barcode_value: string | null;
  raw_text: string;
}

export interface ExtractionResult {
  filename: string;
  data: LabelData[] | null;
  error?: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}