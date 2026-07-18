export interface AnimeFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  seriesId: string;
  seriesName: string;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface AnimeSeries {
  id: string;
  name: string;
  episodes: AnimeFile[];
  isFavorite: boolean;
  bannerImage?: string;
}

export interface WatchProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  watched: boolean;
  lastWatchedAt: string;
}

export interface UserHistory {
  [fileId: string]: WatchProgress;
}

export interface UserData {
  history: UserHistory;
  favorites: string[]; // array of Series IDs
}
