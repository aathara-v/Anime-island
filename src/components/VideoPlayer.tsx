import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Tv,
  Loader2,
  ArrowLeft
} from "lucide-react";

interface VideoPlayerProps {
  fileId: string;
  accessToken: string;
  title: string;
  seriesName: string;
  initialTime?: number;
  onProgress: (currentTime: number, duration: number, watched: boolean) => void;
  onBack: () => void;
}

export default function VideoPlayer({
  fileId,
  title,
  seriesName,
  initialTime = 0,
  onProgress,
  onBack,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [streamUrl, setStreamUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState("");

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Stream Source
  useEffect(() => {
    let mounted = true;
    const fetchStream = async () => {
      setIsBuffering(true);
      if (fileId.startsWith("demo_")) {
        if (fileId === "demo_sintel_ep1") setStreamUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4");
        else if (fileId === "demo_bunny_ep1") setStreamUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
        else if (fileId === "demo_tears_ep1") setStreamUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4");
        setIsBuffering(false);
        setIsPlaying(true);
        return;
      }

      try {
        const response = await fetch(`/api/anime/watch?episodeId=${encodeURIComponent(fileId)}`);
        if (!response.ok) throw new Error("Failed to load stream");
        const data = await response.json();
        
        if (data && data.sources && data.sources.length > 0) {
          // Prefer 1080p or default or auto
          let bestSource = data.sources.find((s: any) => s.quality === "default" || s.quality === "1080p") || data.sources[0];
          if (mounted) {
            setStreamUrl(bestSource.url);
            setIsPlaying(true);
          }
        } else {
          throw new Error("No stream sources found");
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError("Could not load stream.");
      } finally {
        if (mounted) setIsBuffering(false);
      }
    };
    fetchStream();
    return () => { mounted = false; };
  }, [fileId]);

  // Handle controls hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    if (playerRef.current) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      playerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div
      id="video-player-root"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative bg-black select-none overflow-hidden flex items-center justify-center transition-all duration-300 ${
        isTheaterMode && !isFullscreen ? "w-full aspect-[21/9]" : "w-full aspect-video"
      }`}
    >
      {streamUrl ? (
        <ReactPlayer
          ref={playerRef}
          src={streamUrl}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          playbackRate={playbackRate}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onTimeUpdate={(e: any) => {
            const current = e.currentTarget.currentTime;
            setCurrentTime(current);
            const hasFinished = current >= duration - 15;
            setIsFinished(hasFinished);
            onProgress(current, duration, hasFinished);
          }}
          onDurationChange={(e: any) => setDuration(e.currentTarget.duration)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onReady={() => {
            setIsBuffering(false);
            if (initialTime > 0 && playerRef.current) {
              playerRef.current.currentTime = initialTime;
            }
          }}
          onClick={togglePlay}
          controlsList="nodownload"
          playsInline={true}
        />
      ) : (
        <div className="text-white z-10">{error || "Loading stream..."}</div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 className="w-16 h-16 animate-spin text-red-600" />
        </div>
      )}

      {!isPlaying && !isBuffering && streamUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="p-6 bg-black/60 rounded-full hover:scale-110 hover:bg-red-600/90 transition-all border border-white/20">
            <Play className="w-12 h-12 fill-current text-white translate-x-1" />
          </div>
        </div>
      )}

      {/* Control bar overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white font-medium transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-right">
             <span className="block text-white font-semibold text-lg">{seriesName}</span>
             <span className="block text-slate-300 text-sm">{title}</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-12 flex flex-col gap-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-4 group/slider w-full">
            <span className="text-sm font-medium text-white w-12 text-center">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
            />
            <span className="text-sm font-medium text-slate-400 w-12 text-center">
              {formatTime(duration - currentTime)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-6">
              <button
                onClick={togglePlay}
                className="text-white hover:text-slate-300 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              </button>
              
              <button
                onClick={() => skipTime(-10)}
                className="text-white hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-7 h-7" />
              </button>
              <button
                onClick={() => skipTime(10)}
                className="text-white hover:text-slate-300 transition-colors"
              >
                <RotateCw className="w-7 h-7" />
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-slate-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                </button>
                <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-in-out">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-red-600 ml-2"
                  />
                </div>
              </div>

              {isFinished && (
                <span className="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded">
                  Completed
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 text-white">
              <div className="relative group flex items-center">
                <Settings className="w-7 h-7 hover:text-slate-300 transition-colors cursor-pointer" />
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="absolute right-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>
              </div>
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="hover:text-slate-300 transition-colors"
              >
                <Tv className="w-6 h-6" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="hover:text-slate-300 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
