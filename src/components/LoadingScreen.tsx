import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
  isLoadingData: boolean;
}

export default function LoadingScreen({ onComplete, isLoadingData }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);

      if (calculatedProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 300);
      }

      setProgress(Math.round(calculatedProgress));
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 overflow-hidden select-none">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-extrabold tracking-tighter text-red-600 font-sans uppercase">
          ANIME <span className="text-white">ISLAND</span>
        </h1>
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
      </div>
    </div>
  );
}

