import type { SocrataData } from "~/app/_hooks/useSocrataData";
import { createContext, useState, useContext, type ReactNode } from "react";

export type ActiveCamera = SocrataData & {
  imageUrl: string | null;
  isLoading: boolean;
  screenX?: number;
  screenY?: number;
};

interface ActiveCamerasContextType {
  activeCameras: ActiveCamera[];
  setActiveCameras: React.Dispatch<React.SetStateAction<ActiveCamera[]>>;
}

const ActiveCamerasContext = createContext<ActiveCamerasContextType | undefined>(
  undefined,
);

export function ActiveCamerasProvider({ children }: { children: ReactNode }) {
  const [activeCameras, setActiveCameras] = useState<ActiveCamera[]>([]);

  return (
    <ActiveCamerasContext.Provider value={{ activeCameras, setActiveCameras }}>
      {children}
    </ActiveCamerasContext.Provider>
  );
}

export function useActiveCameras() {
  const context = useContext(ActiveCamerasContext);
  if (context === undefined) {
    throw new Error("useActiveCameras must be used within an ActiveCamerasProvider");
  }
  return context;
} 