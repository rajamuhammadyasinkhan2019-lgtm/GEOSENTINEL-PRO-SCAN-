
export type DrainageRegion = 'Indus' | 'Swat' | 'Hunza' | 'Gilgit' | 'Soan' | 'Global';
export type ScanningMode = 'FIELD' | 'THIN_SECTION';

export interface RockIdentification {
  name: string;
  lithology: string; // Igneous, Sedimentary, Metamorphic
  confidence: number;
  metadata: {
    texture: string;
    composition: string; // Mineral composition
    environment: string; // Formation environment
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
    transportDistance: string; // Estimations like "Short (0-5km)", "Long (>50km)"
    sourceProximity: string; // Near source, Distal, etc.
  };
  petrography?: {
    mineralEstimatedPercentages: Record<string, string>;
    opticalFeatures: string[]; // e.g., "Plagioclase twinning", "Opaque grains"
    grainBoundaries: string; // e.g., "Sutured", "Interlocking"
    classification: string; // e.g., "Wacke", "Porphyritic"
  };
  biogenicVerification?: {
    isFossil: boolean;
    fossilType?: string;
    confidence: number;
    analysisNote: string; // Why it's a fossil or pseudofossil
  };
  geologicalAge?: string;
}

export interface ScanResult {
  identification: RockIdentification;
  timestamp: number;
  capturedFrame: string;
  mode: ScanningMode;
}

export interface AppState {
  isScanning: boolean;
  mode: ScanningMode;
  selectedDrainage: DrainageRegion;
  lastResult: ScanResult | null;
  history: ScanResult[];
  error: string | null;
}
