import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface PromptState {
  aiProvider: string;
  apiKey: string;
  aiModel: string;
  cameraBody: string;
  aspectRatio: string;
  resolution: string;
  purpose: string;
  format: string;
  medium: string;
  photoStyle: string;
  cinemaStyle: string;
  directorStyle: string;
  artStyle: string;
  filmStock: string;
  lens: string;
  focalLength: string;
  aperture: string;
  angle: string;
  shotSize: string;
  composition: string;
  quality: string;
  mood: string;
  lightType: { primary: string; accent: string };
  timeOfDay: { primary: string; accent: string };
  lightFX: string[];
  colorPalette: string;
  skinDetail: string[];
  hairDetail: string[];
  material: string[];
  typography: string[];
  referenceType: string;
  referenceWeight: number;
  mainSubject: string;
  textContent: string;
  negativePrompt: string;
  quickStyle: string;
  fashionFoodStyle: string;
  emotion: string;
  generateFourMode: boolean;
  grid3x3Mode: boolean;
  maxConsistency: boolean;
  beforeAfter: boolean;
  seamlessPattern: boolean;
  seed: string;
  mjVersion: string;
  mjStyle: string;
  mjStylize: number;
  mjChaos: number;
  mjWeird: number;
  sdCfg: number;
  sdSteps: number;
  fluxModel: string;
  fluxGuidance: number;
  fluxSteps: number;
  dalleStyle: string;
  dalleQuality: string;
  skinRenderBoost: boolean;
  hairRenderBoost: boolean;
  referenceImages: any[];
  promptFormat: "flat" | "structured" | "midjourney";
  isStandardPresetActive: boolean;
}

const initialState: PromptState = {
  aiProvider: "groq",
  apiKey: "",
  aiModel: "",
  cameraBody: "",
  aspectRatio: "",
  resolution: "",
  purpose: "",
  format: "",
  medium: "",
  photoStyle: "",
  cinemaStyle: "",
  directorStyle: "",
  artStyle: "",
  filmStock: "",
  lens: "",
  focalLength: "",
  aperture: "",
  angle: "",
  shotSize: "",
  composition: "",
  quality: "",
  mood: "",
  lightType: { primary: "", accent: "" },
  timeOfDay: { primary: "", accent: "" },
  lightFX: [],
  colorPalette: "",
  skinDetail: [],
  hairDetail: [],
  material: [],
  typography: [],
  referenceType: "",
  referenceWeight: 50,
  mainSubject: "",
  textContent: "",
  negativePrompt: "",
  quickStyle: "",
  fashionFoodStyle: "",
  emotion: "",
  generateFourMode: false,
  grid3x3Mode: false,
  maxConsistency: false,
  beforeAfter: false,
  seamlessPattern: false,
  seed: "",
  mjVersion: "7",
  mjStyle: "",
  mjStylize: 250,
  mjChaos: 0,
  mjWeird: 0,
  sdCfg: 7,
  sdSteps: 25,
  fluxModel: "dev",
  fluxGuidance: 3.5,
  fluxSteps: 28,
  dalleStyle: "vivid",
  dalleQuality: "hd",
  skinRenderBoost: false,
  hairRenderBoost: false,
  referenceImages: [],
  promptFormat: "flat",
  isStandardPresetActive: false,
};

interface PromptStateContextType {
  state: PromptState;
  updateState: (updates: Partial<PromptState>) => void;
  resetState: () => void;
}

const PromptStateContext = createContext<PromptStateContextType | undefined>(
  undefined,
);

export const PromptStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PromptState>(initialState);

  const updateState = (updates: Partial<PromptState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState(initialState);
  };

  return (
    <PromptStateContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </PromptStateContext.Provider>
  );
};

export const usePromptState = () => {
  const context = useContext(PromptStateContext);
  if (context === undefined) {
    throw new Error("usePromptState must be used within a PromptStateProvider");
  }
  return context;
};
