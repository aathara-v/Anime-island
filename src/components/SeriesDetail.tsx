import React from "react";
import { Play, Plus, Check, ArrowLeft, Info, CheckCircle } from "lucide-react";
import { AnimeSeries, UserHistory } from "../types";

interface SeriesDetailProps {
  series: AnimeSeries;
  history: UserHistory;
  isFavorite: boolean;
  onToggleFavorite: (seriesId: string) => void;
  onPlayEpisode: (fileId: string) => void;
  onToggleWatched: (fileId: string, watched: boolean) => void;
  onBack: () => void;
}

export default function SeriesDetail({
  series,
  history,
  isFavorite,
  onToggleFavorite,
  onPlayEpisode,
  onToggleWatched,
  onBack,
}: SeriesDetailProps) {
  
  const totalEpisodes = series.episodes.length;
  const watchedEpisodes = series.episodes.filter(ep => history[ep.id]?.watched).length;

  return (
    <div className="w-full flex flex-col bg-[#141414]">
      {/* Hero Banner Section */}
      <div 
        className="relative w-full h-[50vh] md:h-[60vh] bg-[#222] bg-cover bg-center"
        style={series.bannerImage ? { backgroundImage: `url(${series.bannerImage})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent z-10" />
        
        {/* Abstract Background for Hero if no image */}
        {!series.bannerImage && (
          <div className="absolute inset-0 flex items-center justify-end overflow-hidden opacity-30">
             <h1 className="text-[200px] font-black text-slate-500 uppercase tracking-tighter mr-[-10%] select-none whitespace-nowrap">
               {series.name.split(" ")[0]}
             </h1>
          </div>
        )}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 z-20 p-6 md:p-12 w-full md:w-2/3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Browse
          </button>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            {series.name}
          </h2>
          
          <div className="flex items-center gap-4 text-sm text-slate-300 font-semibold mb-6">
            <span className="text-green-500 font-bold">98% Match</span>
            <span>2026</span>
            <span className="px-1.5 border border-slate-600 rounded text-xs text-slate-400">TV-MA</span>
            <span>{totalEpisodes} Episodes</span>
            {watchedEpisodes > 0 && (
              <span className="text-slate-400">{watchedEpisodes} Watched</span>
            )}
          </div>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl mb-8 line-clamp-3">
            An incredible journey awaits in this critically acclaimed series. Discover new worlds, epic battles, and unforgettable characters in every episode of {series.name}.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlayEpisode(series.episodes[0].id)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded font-bold hover:bg-white/80 transition-colors"
            >
              <Play className="w-6 h-6 fill-current" /> Play
            </button>
            <button
              onClick={() => onToggleFavorite(series.id)}
              className="flex items-center gap-2 p-2.5 bg-[#2b2b2b]/80 border border-white/20 text-white rounded-full hover:border-white transition-colors"
              title={isFavorite ? "Remove from My List" : "Add to My List"}
            >
              {isFavorite ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
            <button
              className="flex items-center gap-2 p-2.5 bg-[#2b2b2b]/80 border border-white/20 text-white rounded-full hover:border-white transition-colors"
              title="More Info"
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="px-6 md:px-12 py-8 z-20 relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Episodes</h3>
        </div>

        <div className="flex flex-col gap-2">
          {series.episodes.map((ep, idx) => {
            const epProgress = history[ep.id];
            const isWatched = epProgress?.watched;
            const hasStarted = epProgress && epProgress.currentTime > 5 && !isWatched;
            const progressPercentage = hasStarted && epProgress.duration
              ? (epProgress.currentTime / epProgress.duration) * 100
              : 0;

            const episodeNum = ep.episodeNumber !== undefined ? ep.episodeNumber : idx + 1;

            return (
              <div
                key={ep.id}
                className="group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded bg-[#181818] border-b border-[#2b2b2b] hover:bg-[#2b2b2b] transition-colors"
              >
                {/* Number & Thumbnail */}
                <div className="flex items-center gap-4 md:w-1/4 shrink-0">
                  <span className="text-xl md:text-2xl font-semibold text-slate-500 w-8 text-center group-hover:text-white transition-colors">
                    {episodeNum}
                  </span>
                  
                  <div 
                    onClick={() => onPlayEpisode(ep.id)}
                    className="relative aspect-video w-32 md:w-40 bg-[#333] rounded overflow-hidden cursor-pointer shrink-0"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                    {/* Progress bar overlay on thumbnail if partially watched */}
                    {hasStarted && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                        <div 
                          style={{ width: `${progressPercentage}%` }} 
                          className="h-full bg-red-600"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0 pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-semibold text-white">
                      {ep.episodeTitle || ep.name}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {ep.name}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 self-end md:self-auto pl-12 md:pl-0 mt-2 md:mt-0 shrink-0">
                  <button
                    onClick={() => onToggleWatched(ep.id, !isWatched)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                  >
                    {isWatched ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-400 group-hover:border-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
