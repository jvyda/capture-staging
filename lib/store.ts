import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  name: string;
  clips: Clip[];
  muted: boolean;
  volume: number;
  locked: boolean;
}

interface Clip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'text';
  startTime: number;
  endTime: number;
  source: string;
  thumbnail?: string;
  effects: Effect[];
}

interface Effect {
  id: string;
  type: string;
  params: Record<string, any>;
  keyframes: Keyframe[];
}

interface Keyframe {
  time: number;
  value: any;
}

interface EditorState {
  tracks: Track[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
  currentTime: number;
  duration: number;
  zoom: number;
  isPlaying: boolean;
  volume: number;
  actions: {
    addTrack: (track: Omit<Track, 'id'>) => void;
    removeTrack: (id: string) => void;
    addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => void;
    removeClip: (trackId: string, clipId: string) => void;
    updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
    setSelectedTrack: (id: string | null) => void;
    setSelectedClip: (id: string | null) => void;
    setCurrentTime: (time: number) => void;
    setZoom: (zoom: number) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
  };
}

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        tracks: [],
        selectedTrackId: null,
        selectedClipId: null,
        currentTime: 0,
        duration: 0,
        zoom: 1,
        isPlaying: false,
        volume: 1,
        actions: {
          addTrack: (track) =>
            set((state) => ({
              tracks: [...state.tracks, { ...track, id: crypto.randomUUID() }],
            })),
          removeTrack: (id) =>
            set((state) => ({
              tracks: state.tracks.filter((track) => track.id !== id),
            })),
          addClip: (trackId, clip) =>
            set((state) => ({
              tracks: state.tracks.map((track) =>
                track.id === trackId
                  ? {
                      ...track,
                      clips: [...track.clips, { ...clip, id: crypto.randomUUID(), trackId }],
                    }
                  : track
              ),
            })),
          removeClip: (trackId, clipId) =>
            set((state) => ({
              tracks: state.tracks.map((track) =>
                track.id === trackId
                  ? {
                      ...track,
                      clips: track.clips.filter((clip) => clip.id !== clipId),
                    }
                  : track
              ),
            })),
          updateClip: (trackId, clipId, updates) =>
            set((state) => ({
              tracks: state.tracks.map((track) =>
                track.id === trackId
                  ? {
                      ...track,
                      clips: track.clips.map((clip) =>
                        clip.id === clipId ? { ...clip, ...updates } : clip
                      ),
                    }
                  : track
              ),
            })),
          setSelectedTrack: (id) =>
            set({ selectedTrackId: id }),
          setSelectedClip: (id) =>
            set({ selectedClipId: id }),
          setCurrentTime: (time) =>
            set({ currentTime: time }),
          setZoom: (zoom) =>
            set({ zoom: zoom }),
          togglePlay: () =>
            set((state) => ({ isPlaying: !state.isPlaying })),
          setVolume: (volume) =>
            set({ volume: volume }),
        },
      }),
      {
        name: 'editor-storage',
      }
    )
  )
);