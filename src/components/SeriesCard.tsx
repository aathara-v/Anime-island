import React from "react";
import { Play, CheckCircle } from "lucide-react";
import { AnimeSeries, UserHistory } from "../types";

interface SeriesCardProps {
  key?: string;
  series: AnimeSeries;
  history: UserHistory;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, seriesId: string) => void;
  onSelect: (seriesId: string) => void;
}

export default function SeriesCard({
  series,
  history,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: SeriesCardProps) {
  // Calculate completion statistics
  const totalEpisodes = series.episodes.length;
  let watchedEpisodes = 0;
  
  for (const ep of series.episodes) {
    if (history[ep.id]?.watched) {
      watchedEpisodes++;
    }
  }

  const watchedPercentage = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
  const isCompleted = totalEpisodes > 0 && watchedEpisodes === totalEpisodes;

  return (
    <div
      onClick={() => onSelect(series.id)}
      className="group relative bg-[#141414] rounded-md overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 flex flex-col h-full shadow-lg"
    >
      {/* Visual Header / Banner Placeholder */}
      <div 
        className="relative aspect-video bg-[#222] bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={series.bannerImage ? { backgroundImage: `url(${series.bannerImage})` } : undefined}
      >
        {/* Placeholder title for poster if no banner */}
        {!series.bannerImage && (
          <h3 className="text-2xl font-black text-slate-600 uppercase tracking-widest text-center px-4">
            {series.name.split(" ")[0]}
          </h3>
        )}

        {/* Watch percentage overlay tag */}
        {watchedEpisodes > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white flex items-center gap-1">
            {isCompleted ? (
              <CheckCircle className="w-3 h-3 text-red-600" />
            ) : (
              `${watchedEpisodes}/${totalEpisodes}`
            )}
          </div>
        )}

        {/* Play hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <div className="p-3 bg-white text-black rounded-full scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          </div>
        </div>
        
        {/* Progress bar overlay on thumbnail if partially watched */}
        {watchedPercentage > 0 && watchedPercentage < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div 
              style={{ width: `${watchedPercentage}%` }} 
              className="h-full bg-red-600"
            />
          </div>
        )}
      </div>

      {/* Metadata content */}
      <div className="p-3 flex-grow flex flex-col justify-start">
        <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">
          {series.name}
        </h3>
        <span className="text-[11px] text-slate-500 mt-1">
          {totalEpisodes} {totalEpisodes === 1 ? "Episode" : "Episodes"}
        </span>
      </div>
    </div>
  );
}

