import { useEffect, useRef } from 'react';
import { authService } from '@/lib/authService';

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayerInstance };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type PlayerProps = {
  videoId: string;
  youtubeId: string;
  title: string;
  sessionId: string;
  onWatchedEnough: () => void;
  onCloseSummary: (summary: { watchedSeconds: number; progressPercent: number }) => void;
};

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    const existing = document.getElementById('youtube-iframe-api') as HTMLScriptElement | null;
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('YouTube player could not be loaded.'));
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

export default function YouTubeLearningPlayer({ videoId, youtubeId, title, sessionId, onWatchedEnough, onCloseSummary }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const watchedSecondsRef = useRef(0);
  const maxProgressRef = useRef(0);
  const progressBucketRef = useRef(-1);
  const hasRecordedPlayRef = useRef(false);
  const hasMarkedEnoughRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const emit = (event_type: 'video_played' | 'video_paused' | 'video_progress' | 'rewound', metadata: Record<string, number> = {}) => {
      void authService.recordLearningEvent({ target_type: 'video', target_id: videoId, event_type, session_id: sessionId, metadata }).catch(() => undefined);
    };
    const sampleProgress = () => {
      const player = playerRef.current;
      if (!player) return;
      const current = Math.max(0, player.getCurrentTime() || 0);
      const duration = Math.max(0, player.getDuration() || 0);
      const delta = current - lastTimeRef.current;
      if (delta > 0) watchedSecondsRef.current += Math.min(delta, 15);
      if (delta <= -8) emit('rewound', { rewind_seconds: Math.abs(delta), current_time_seconds: current });
      lastTimeRef.current = current;
      const progress = duration ? Math.min(100, Math.round((current / duration) * 100)) : 0;
      maxProgressRef.current = Math.max(maxProgressRef.current, progress);
      const bucket = Math.floor(progress / 25);
      if (bucket > progressBucketRef.current || progress >= 100) {
        progressBucketRef.current = bucket;
        emit('video_progress', { progress_percent: progress, current_time_seconds: current });
      }
      if (progress >= 90 && !hasMarkedEnoughRef.current) {
        hasMarkedEnoughRef.current = true;
        onWatchedEnough();
      }
    };

    loadYouTubeIframeApi().then(() => {
      if (!isMounted || !containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: { autoplay: 0, rel: 0, origin: window.location.origin },
        events: {
          onStateChange: (event: { data: number }) => {
            // YouTube states: -1 unstarted, 0 ended, 1 playing, 2 paused.
            if (event.data === 1) {
              playingRef.current = true;
              if (!hasRecordedPlayRef.current) {
                hasRecordedPlayRef.current = true;
                emit('video_played');
              }
            } else if (event.data === 2) {
              sampleProgress();
              playingRef.current = false;
              emit('video_paused');
            } else if (event.data === 0) {
              sampleProgress();
              playingRef.current = false;
              maxProgressRef.current = 100;
              onWatchedEnough();
            }
          },
        },
      });
    }).catch(() => undefined);

    const interval = window.setInterval(() => {
      if (playingRef.current) sampleProgress();
    }, 5_000);
    return () => {
      window.clearInterval(interval);
      if (playingRef.current) sampleProgress();
      onCloseSummary({ watchedSeconds: Math.round(watchedSecondsRef.current), progressPercent: maxProgressRef.current });
      playerRef.current?.destroy();
      playerRef.current = null;
      isMounted = false;
    };
  }, [onCloseSummary, onWatchedEnough, sessionId, videoId, youtubeId]);

  return <div ref={containerRef} className="aspect-video w-full bg-slate-950" aria-label={`YouTube player for ${title}`} />;
}
