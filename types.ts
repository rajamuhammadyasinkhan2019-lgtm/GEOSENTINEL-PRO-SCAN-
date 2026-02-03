
export type DrainageRegion = 'Indus' | 'Swat' | 'Hunza' | 'Gilgit' | 'Soan' | 'Global';
export type ScanningMode = 'FIELD' | 'THIN_SECTION';

export interface RockIdentification {
  name: string;
  lithology: string;
  classification: string;
  confidence: number;
  metadata: {
    texture: string;
    composition: string;
    environment: string;
    origin: string;
    commonUses: string;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';
  };
  physicalCharacteristics: {
    grainSize: string;
    hardness: string;
    color: string;
  };
  provenance: {
    roundness: 'Angular' | 'Sub-angular' | 'Sub-rounded' | 'Rounded';
    transportDistance: string;
    sourceProximity: string;
  };
  petrography?: {
    primaryMinerals: Record<string, string>;
    accessoryMinerals: Record<string, string>;
    opticalFeatures: string[];
    grainBoundaries: string;
    classification: string;
  };
  biogenicVerification?: {
    isFossil: boolean;
    fossilType?: string;
    confidence: number;
    analysisNote: string;
  };
  geologicalAge?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}

export interface ScanResult {
  identification: RockIdentification;
  timestamp: number;
  capturedFrame: string;
  mode: ScanningMode;
  visualizedEnvironmentUrl?: string;
}

export interface AppState {
  isScanning: boolean;
  mode: ScanningMode;
  selectedDrainage: DrainageRegion;
  lastResult: ScanResult | null;
  history: ScanResult[];
  error: string | null;
  isVisualizing: boolean;
  chatHistory: ChatMessage[];
  isChatting: boolean;
}