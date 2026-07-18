import React, { useEffect, useState, useMemo } from "react";
import { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  googleSignIn,
  initAuth,
  logout,
} from "./lib/firebase";
import { AnimeSeries, AnimeFile, UserHistory, UserData } from "./types";
import LoadingScreen from "./components/LoadingScreen";
import SeriesCard from "./components/SeriesCard";
import SeriesDetail from "./components/SeriesDetail";
import VideoPlayer from "./components/VideoPlayer";
import {
  Ship,
  LogOut,
  User as UserIcon,
  Search,
  Grid,
  Heart,
  History,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Info,
  Volume2,
  Tv,
  Anchor,
  Play,
  PlayCircle,
  SlidersHorizontal,
} from "lucide-react";

export default function App() {
  // Navigation & Loading States
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [guestUsername, setGuestUsername] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [seriesList, setSeriesList] = useState<AnimeSeries[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User States (History & Favorites)
  const [watchHistory, setWatchHistory] = useState<UserHistory>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Dashboard UI State
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "history">("all");

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        setNeedsAuth(false);
        setErrorMessage(null);
        await handleAuthSuccess(firebaseUser, token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync user history and load anime library on successful authentication
  const handleAuthSuccess = async (currentUser: User, token: string) => {
    setIsLoadingData(true);
    setErrorMessage(null);
    
    // 1. Load watch history and favorites from server & sync with localStorage
    try {
      const res = await fetch(`/api/userData?email=${encodeURIComponent(currentUser.email!)}`);
      let serverHistory: UserHistory = {};
      let serverFavs: string[] = [];
      
      if (res.ok) {
        const data = await res.json();
        serverHistory = data.history || {};
        serverFavs = data.favorites || [];
      }

      // Check local storage
      const localKey = `anime_island_history_${currentUser.email}`;
      const localRaw = localStorage.getItem(localKey);
      let mergedHistory = { ...serverHistory };
      let mergedFavorites = [...serverFavs];

      if (localRaw) {
        try {
          const localData = JSON.parse(localRaw);
          const localHist = localData.history || {};
          
          // Merge history based on timestamps
          for (const key of Object.keys(localHist)) {
            const localProgress = localHist[key];
            const serverProgress = serverHistory[key];
            if (
              !serverProgress ||
              new Date(localProgress.lastWatchedAt) > new Date(serverProgress.lastWatchedAt)
            ) {
              mergedHistory[key] = localProgress;
            }
          }
          
          // Merge favorites
          mergedFavorites = Array.from(new Set([...mergedFavorites, ...(localData.favorites || [])]));
        } catch (e) {
          console.error("Local storage parse error:", e);
        }
      }

      setWatchHistory(mergedHistory);
      setFavorites(mergedFavorites);

      // Save merged to server and local
      const syncPayload = { history: mergedHistory, favorites: mergedFavorites };
      localStorage.setItem(localKey, JSON.stringify(syncPayload));
      
      await fetch("/api/userData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, ...syncPayload }),
      });
    } catch (err) {
      console.error("Failed to load user progress:", err);
    }

    // 2. Load the Anime Island catalog
    try {
      loadAnimeLibrary();
    } catch (err: any) {
      console.error("Failed to load anime library:", err);
      setErrorMessage("Failed to load anime library.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        await handleAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error("Authentication failed:", err);
      setErrorMessage("Authentication failed. Please verify your internet connection and try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = guestUsername.trim();
    if (!trimmedUsername) return;
    
    setIsLoggingIn(true);
    try {
      const fakeUser = {
        email: `guest_${trimmedUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}@animeisland.local`,
        uid: `guest_${Date.now()}`,
        displayName: trimmedUsername,
      } as any as User;
      
      setUser(fakeUser);
      setAccessToken("guest_token");
      setNeedsAuth(false);
      setErrorMessage(null);
      await handleAuthSuccess(fakeUser, "guest_token");
    } catch (err) {
      console.error("Guest login failed:", err);
      setErrorMessage("Guest login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (user && !user.uid.startsWith("guest_")) {
      await logout();
    }
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setSeriesList([]);
    setSelectedSeriesId(null);
    setActiveEpisodeId(null);
    setShowGuestInput(false);
    setGuestUsername("");
  };

  // Load standard premium anime dataset
  const loadAnimeLibrary = async () => {
    try {
      const response = await fetch("/api/anime/trending");
      if (!response.ok) throw new Error("Failed to fetch trending");
      
      const data = await response.json();
      
      if (data && data.results) {
        const series = data.results.map((item: any) => ({
          id: item.id,
          name: item.title,
          isFavorite: false,
          bannerImage: item.image,
          episodes: [] // We'll fetch episodes when viewing detail
        }));
        setSeriesList(series);
      }
    } catch (err) {
      console.error(err);
      // Fallback to demo data
      const defaultSeries: AnimeSeries[] = [
        {
          id: "demo_sintel",
          name: "Sintel (Sci-Fi Adventure)",
          isFavorite: false,
          episodes: [
            {
              id: "demo_sintel_ep1",
              name: "[AnimeIsland] Sintel - Episode 01 - The Dragon's Hatchling [1080p].mp4",
              mimeType: "video/mp4",
              size: "150343292",
              seriesId: "demo_sintel",
              seriesName: "Sintel (Sci-Fi Adventure)",
              episodeNumber: 1,
              episodeTitle: "The Dragon's Hatchling",
            },
          ],
        }
      ];
      setSeriesList(defaultSeries);
    }
  };

  // Save changes locally and sync with background API debounced
  const saveUserData = async (updatedHistory: UserHistory, updatedFavs: string[]) => {
    if (!user) return;
    const localKey = `anime_island_history_${user.email}`;
    const payload = { history: updatedHistory, favorites: updatedFavs };
    localStorage.setItem(localKey, JSON.stringify(payload));

    try {
      await fetch("/api/userData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          history: updatedHistory,
          favorites: updatedFavs,
        }),
      });
    } catch (err) {
      console.error("Failed to sync progress with Express server:", err);
    }
  };

  // Toggle favorite series
  const handleToggleFavorite = (seriesId: string) => {
    let newFavs: string[];
    if (favorites.includes(seriesId)) {
      newFavs = favorites.filter((id) => id !== seriesId);
    } else {
      newFavs = [...favorites, seriesId];
    }
    setFavorites(newFavs);
    saveUserData(watchHistory, newFavs);
  };

  // Handle progress updates from VideoPlayer
  const handleProgressUpdate = (fileId: string, currentTime: number, duration: number, watched: boolean) => {
    if (duration <= 0) return;
    
    const percentage = (currentTime / duration) * 100;
    const progress = {
      currentTime,
      duration,
      percentage,
      watched,
      lastWatchedAt: new Date().toISOString(),
    };

    const newHistory = {
      ...watchHistory,
      [fileId]: progress,
    };

    setWatchHistory(newHistory);
    
    // Save periodically or at checkpoint
    // To prevent network spam, we write to API, but standard calls will handle local storage instantly
    saveUserData(newHistory, favorites);
  };

  // Manual Watched Toggle
  const handleToggleWatchedManual = (fileId: string, watched: boolean) => {
    const existing = watchHistory[fileId];
    const newHistory = {
      ...watchHistory,
      [fileId]: {
        currentTime: watched ? (existing?.duration || 1440) : 0,
        duration: existing?.duration || 1440,
        percentage: watched ? 100 : 0,
        watched,
        lastWatchedAt: new Date().toISOString(),
      },
    };
    setWatchHistory(newHistory);
    saveUserData(newHistory, favorites);
  };

  // Helper selectors
  const activeSeries = useMemo(() => {
    return seriesList.find((s) => s.id === selectedSeriesId) || null;
  }, [seriesList, selectedSeriesId]);

  const activeEpisode = useMemo(() => {
    if (!activeSeries) return null;
    return activeSeries.episodes.find((e) => e.id === activeEpisodeId) || null;
  }, [activeSeries, activeEpisodeId]);

  const handleSelectSeries = async (seriesId: string) => {
    try {
      const series = seriesList.find(s => s.id === seriesId);
      if (series && series.episodes.length === 0) {
        setIsLoadingData(true);
        const response = await fetch(`/api/anime/info?id=${encodeURIComponent(seriesId)}`);
        if (!response.ok) throw new Error("Failed to fetch info");
        const data = await response.json();
        
        // update the series list
        const updatedSeriesList = seriesList.map(s => {
          if (s.id === seriesId) {
            return {
              ...s,
              episodes: data.episodes.map((ep: any) => ({
                id: ep.id,
                name: ep.title || `Episode ${ep.number}`,
                mimeType: "video/mp4",
                seriesId: s.id,
                seriesName: s.name,
                episodeNumber: ep.number,
                episodeTitle: ep.title,
              }))
            };
          }
          return s;
        });
        setSeriesList(updatedSeriesList);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load episodes for this series");
    } finally {
      setIsLoadingData(false);
      setSelectedSeriesId(seriesId);
    }
  };

  // Compute stats for current library
  const dashboardStats = useMemo(() => {
    let totalEps = 0;
    let watchedEps = 0;
    for (const s of seriesList) {
      totalEps += s.episodes.length;
      for (const ep of s.episodes) {
        if (watchHistory[ep.id]?.watched) {
          watchedEps++;
        }
      }
    }
    const globalPercent = totalEps > 0 ? (watchedEps / totalEps) * 100 : 0;
    return {
      totalSeries: seriesList.length,
      totalEpisodes: totalEps,
      watchedEpisodes: watchedEps,
      globalPercent,
    };
  }, [seriesList, watchHistory]);

  // Search from API
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If empty, load trending if we don't have it already or keep existing
      if (seriesList.length <= 1 && !isLoadingData) {
        loadAnimeLibrary();
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch(`/api/anime/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        
        if (data && data.results) {
          const newSeries = data.results.map((item: any) => ({
            id: item.id,
            name: item.title,
            isFavorite: false,
            bannerImage: item.image,
            episodes: []
          }));
          
          // Merge with existing favorites and history if needed, but for now just replacing seriesList is fine.
          // Wait, if we replace seriesList, we might lose some series we have history for.
          // Let's just append to seriesList and deduplicate by id.
          setSeriesList(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const filteredNew = newSeries.filter((s: any) => !existingIds.has(s.id));
            return [...prev, ...filteredNew];
          });
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoadingData(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter series based on search & tab selected
  const filteredSeriesList = useMemo(() => {
    return seriesList.filter((s) => {
      // 1. Filter by search query
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.episodes.some((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.episodeTitle && e.episodeTitle.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      // 2. Filter by tab
      if (activeTab === "favorites") {
        return favorites.includes(s.id);
      }
      if (activeTab === "history") {
        // Return series if any episode is in watch history
        return s.episodes.some((e) => !!watchHistory[e.id]);
      }

      return true;
    });
  }, [seriesList, searchQuery, activeTab, favorites, watchHistory]);

  // Discovered "Continue Watching" list of individual files
  const continueWatchingEpisodes = useMemo(() => {
    const list: { file: AnimeFile; progress: any }[] = [];
    for (const s of seriesList) {
      for (const file of s.episodes) {
        const progress = watchHistory[file.id];
        // If started (watched > 5s) and not fully marked as watched
        if (progress && progress.currentTime > 5 && !progress.watched) {
          list.push({ file, progress });
        }
      }
    }
    // Sort by last watched time descending
    return list.sort((a, b) => new Date(b.progress.lastWatchedAt).getTime() - new Date(a.progress.lastWatchedAt).getTime());
  }, [seriesList, watchHistory]);

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col font-sans select-none antialiased">
      {/* 1. Netflix style loading screen overlay */}
      <AnimatePresence>
        {!isLoaded && (
          <LoadingScreen
            onComplete={() => setIsLoaded(true)}
            isLoadingData={isLoadingData}
          />
        )}
      </AnimatePresence>

      {/* Main Container when loading completes */}
      {isLoaded && (
        <div className="flex-grow flex flex-col relative">
          
          {/* Header Bar */}
          <header className="sticky top-0 bg-black/90 backdrop-blur-md p-4 flex items-center justify-between z-40 transition-colors">
            <div
              onClick={() => {
                setSelectedSeriesId(null);
                setActiveEpisodeId(null);
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase text-red-600 font-sans flex items-center gap-1.5 leading-none">
                  ANIME <span className="text-white">ISLAND</span>
                </h1>
              </div>
            </div>

            {/* Profile Sign-out section */}
            {!needsAuth && user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-slate-200">{user.displayName}</span>
                  <span className="text-[9px] font-mono text-slate-400 max-w-[120px] truncate">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center border border-white/5">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/10 text-white rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </header>

          <main className="flex-grow p-4 md:p-6 w-full mx-auto relative z-10 flex flex-col gap-6">
            
            {/* NO AUTH REQUIREMENT ROUTE */}
            {needsAuth ? (
              <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto p-8 text-center my-12 bg-black/80 backdrop-blur-md rounded-2xl relative overflow-hidden">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Sign In
                </h2>
                <p className="text-slate-400 text-sm mt-4 mb-8 leading-relaxed">
                  Join the platform. Sign in to explore the library, track your episodes watched, and sync watch history.
                </p>

                {/* Google Sign In Button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button w-full relative h-10 select-none overflow-hidden hover:scale-[1.02] active:scale-95 transition-all duration-150"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: "block" }}
                      >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                    </span>
                  </div>
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-px bg-white/10 w-12 flex-grow"></div>
                  <span className="text-xs text-slate-500 font-mono">OR</span>
                  <div className="h-px bg-white/10 w-12 flex-grow"></div>
                </div>

                {!showGuestInput ? (
                  <button
                    onClick={() => setShowGuestInput(true)}
                    className="mt-4 w-full px-4 py-2 bg-[#333] hover:bg-[#444] rounded text-sm font-semibold text-white transition-all active:scale-95"
                  >
                    Use Guest Code
                  </button>
                ) : (
                  <form onSubmit={handleGuestLogin} className="mt-4 flex flex-col gap-3">
                    <input
                      type="text"
                      value={guestUsername}
                      onChange={(e) => setGuestUsername(e.target.value)}
                      placeholder="Enter a guest code..."
                      className="w-full px-4 py-3 bg-[#333] rounded text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowGuestInput(false)}
                        className="px-4 py-3 flex-1 bg-transparent border border-[#333] hover:border-white rounded text-xs font-semibold text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoggingIn || !guestUsername.trim()}
                        className="px-4 py-3 flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-all"
                      >
                        {isLoggingIn ? "Loading..." : "Sign In"}
                      </button>
                    </div>
                  </form>
                )}

                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 flex gap-2 items-center text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            ) : (
              // MAIN DASHBOARD INTERFACE
              <div className="flex flex-col gap-6">
                
                {/* 2. active video player mode */}
                {activeEpisodeId && activeEpisode && activeSeries && (
                  <div className="flex flex-col gap-3">
                    <VideoPlayer
                      fileId={activeEpisodeId}
                      accessToken={accessToken || ""}
                      title={activeEpisode.episodeTitle || activeEpisode.name}
                      seriesName={activeSeries.name}
                      initialTime={watchHistory[activeEpisodeId]?.currentTime || 0}
                      onBack={() => setActiveEpisodeId(null)}
                      onProgress={(currentTime, duration, watched) =>
                        handleProgressUpdate(activeEpisodeId, currentTime, duration, watched)
                      }
                    />
                  </div>
                )}

                {/* 3. series detail or main dashboard split */}
                {!activeEpisodeId && (
                  <>
                    {selectedSeriesId && activeSeries ? (
                      <SeriesDetail
                        series={activeSeries}
                        history={watchHistory}
                        isFavorite={favorites.includes(activeSeries.id)}
                        onToggleFavorite={(id) => handleToggleFavorite(id)}
                        onPlayEpisode={(fileId) => setActiveEpisodeId(fileId)}
                        onToggleWatched={(fileId, watched) => handleToggleWatchedManual(fileId, watched)}
                        onBack={() => setSelectedSeriesId(null)}
                      />
                    ) : (
                      // PRIMARY LIBRARY OVERVIEW
                      <div className="flex flex-col gap-6">
                        
                        {/* Error notice */}
                        {errorMessage && (
                          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-xs text-red-500 flex gap-2 items-center">
                            <Info className="w-4 h-4 text-red-500" />
                            {errorMessage}
                          </div>
                        )}

                        {/* Top Dashboard statistics row */}
                        {seriesList.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#141414] p-4 rounded shadow-lg">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Series</span>
                              <span className="text-2xl font-bold text-white">{dashboardStats.totalSeries}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Episodes</span>
                              <span className="text-2xl font-bold text-white">{dashboardStats.totalEpisodes}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watched</span>
                              <span className="text-2xl font-bold text-white">{dashboardStats.watchedEpisodes}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion</span>
                              <span className="text-2xl font-bold text-white">
                                {Math.round(dashboardStats.globalPercent)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* CONTINUE WATCHING SECTION */}
                        {continueWatchingEpisodes.length > 0 && (
                          <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold text-white">
                              Continue Watching
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {continueWatchingEpisodes.slice(0, 3).map(({ file, progress }) => {
                                const epProgressPercent = (progress.currentTime / progress.duration) * 100;
                                const series = seriesList.find(s => s.id === file.seriesId);
                                return (
                                  <div
                                    key={file.id}
                                    onClick={() => {
                                      handleSelectSeries(file.seriesId);
                                      setActiveEpisodeId(file.id);
                                    }}
                                    className="group relative bg-[#141414] rounded-md cursor-pointer flex flex-col overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
                                  >
                                    <div 
                                      className="relative aspect-video bg-[#222] bg-cover bg-center flex items-center justify-center"
                                      style={series?.bannerImage ? { backgroundImage: `url(${series.bannerImage})` } : undefined}
                                    >
                                      {!series?.bannerImage && (
                                        <h3 className="text-lg font-black text-slate-600 uppercase tracking-widest text-center px-4">
                                          {file.seriesName.split(" ")[0]}
                                        </h3>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                        <div className="p-3 bg-white text-black rounded-full scale-90 group-hover:scale-100 transition-transform duration-300">
                                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                                        <div 
                                          style={{ width: `${epProgressPercent}%` }} 
                                          className="h-full bg-red-600"
                                        />
                                      </div>
                                    </div>
                                    <div className="p-3">
                                      <h4 className="text-sm font-semibold text-white truncate">
                                        {file.seriesName}
                                      </h4>
                                      <span className="block text-xs text-slate-400 mt-1 truncate">
                                        E{file.episodeNumber} - {file.episodeTitle || file.name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* MAIN GRID FILTER TABS & SEARCH ROW */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 mt-4">
                          
                          {/* Search */}
                          <div className="relative w-full sm:max-w-xs shrink-0">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search titles..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-[#141414] border border-transparent focus:border-white focus:bg-black rounded px-4 py-2 pl-10 text-sm text-white placeholder:text-slate-400 focus:outline-none transition-colors"
                            />
                          </div>

                          {/* Tabs */}
                          <div className="flex items-center gap-2 self-start">
                            <button
                              onClick={() => setActiveTab("all")}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                activeTab === "all"
                                  ? "bg-white text-black"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setActiveTab("favorites")}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                activeTab === "favorites"
                                  ? "bg-white text-black"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              My List
                            </button>
                            <button
                              onClick={() => setActiveTab("history")}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                activeTab === "history"
                                  ? "bg-white text-black"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Watch It Again
                            </button>
                          </div>
                        </div>

                        {/* SERIES BENTO GRID / MAIN CONTAINER VIEW */}
                        {isLoadingData ? (
                          <div className="py-24 flex flex-col gap-3 items-center justify-center text-slate-400 text-sm font-mono">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          <>
                            {filteredSeriesList.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredSeriesList.map((series) => (
                                  <SeriesCard
                                    key={series.id}
                                    series={series}
                                    history={watchHistory}
                                    isFavorite={favorites.includes(series.id)}
                                    onToggleFavorite={(e, id) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(id);
                                    }}
                                    onSelect={(id) => handleSelectSeries(id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              // IF GRID IS EMPTY
                              <div className="py-12 text-center flex flex-col items-center max-w-sm mx-auto gap-3">
                                <FolderOpen className="w-12 h-12 text-slate-700" />
                                <h3 className="font-bold text-slate-300">No series found</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {activeTab === "favorites"
                                    ? "Add some series to your favorites to view them in this deck!"
                                    : activeTab === "history"
                                    ? "No active watch records discovered yet. Click play on any episode to start your voyage!"
                                    : "No matching series found under current filters."}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Styled Google Sign-In Button Rules (gsi styles) */}
      <style>{`
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: #f3f4f6;
          background-image: none;
          border: 1px solid #d1d5db;
          -webkit-border-radius: 8px;
          border-radius: 8px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          color: #111827;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          padding: 0 12px;
          position: relative;
          text-align: center;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: 100%;
          max-width: 400px;
          min-width: min-content;
        }

        .gsi-material-button .gsi-material-button-icon {
          height: 20px;
          min-width: 20px;
          width: 20px;
        }

        .gsi-material-button .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: center;
          position: relative;
          width: 100%;
        }

        .gsi-material-button .gsi-material-button-contents {
          flex-grow: 1;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 600;
          letter-spacing: .25px;
          padding-left: 12px;
          text-align: center;
        }

        .gsi-material-button .gsi-material-button-state {
          -webkit-transition: opacity .15s linear;
          transition: opacity .15s linear;
          background-color: #3c4043;
          opacity: 0;
          position: absolute;
          inset: 0;
        }

        .gsi-material-button:hover {
          -webkit-box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
          box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
          background-color: #ffffff;
        }

        .gsi-material-button:active .gsi-material-button-state {
          opacity: 0.12;
        }

        .gsi-material-button:disabled {
          cursor: default;
          background-color: #ffffff6b;
          border-color: #1f1f1f1f;
        }

        .gsi-material-button:disabled .gsi-material-button-contents {
          color: #1f1f1f33;
        }

        .gsi-material-button:disabled .gsi-material-button-icon {
          opacity: .3;
        }
      `}</style>
    </div>
  );
}
