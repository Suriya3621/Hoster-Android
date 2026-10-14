import { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  ListMusic,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDuration } from '../../utils/formatters';
import { isNativelyPlayableAudio } from '../../utils/fileCategory';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({ entry, queue = [], onSelect }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showQueue, setShowQueue] = useState(false);
  const [recent, setRecent] = useLocalStorage('hoster:recentAudio', []);

  const src = api.streamUrl(entry.virtualPath);
  const playable = isNativelyPlayableAudio(entry.name);
  const index = queue.findIndex((q) => q.virtualPath === entry.virtualPath);

  useEffect(() => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.virtualPath !== entry.virtualPath);
      return [{ virtualPath: entry.virtualPath, name: entry.name }, ...filtered].slice(0, 20);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.virtualPath]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  }

  function playAt(delta) {
    if (!queue.length) return;
    const nextIndex = (index + delta + queue.length) % queue.length;
    onSelect?.(queue[nextIndex]);
  }

  if (!playable) {
    return (
      <div className="card p-6 text-center text-sm text-text-muted">
        This audio format can't be played directly in your browser. Try downloading it instead.
      </div>
    );
  }

  return (
    <div className="card p-5 flex flex-col gap-4 max-w-md mx-auto">
      <audio
        ref={audioRef}
        src={src}
        autoPlay
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => playAt(1)}
      />

      <div className="w-full aspect-square rounded-card bg-gradient-to-br from-accent-soft to-surface-alt flex items-center justify-center">
        <Music2 size={48} className="text-accent" />
      </div>

      <div>
        <p className="font-medium truncate">{entry.name}</p>
        <p className="text-xs text-text-muted">
          {formatDuration(current)} / {formatDuration(duration)}
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={current}
        onChange={(e) => {
          audioRef.current.currentTime = Number(e.target.value);
        }}
        className="w-full accent-accent h-1"
      />

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => playAt(-1)} className="p-2 text-text-muted hover:text-text">
          <SkipBack size={20} />
        </button>
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center"
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => playAt(1)} className="p-2 text-text-muted hover:text-text">
          <SkipForward size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMuted((m) => !m);
              audioRef.current.muted = !muted;
            }}
            className="text-text-muted hover:text-text"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setMuted(v === 0);
              audioRef.current.volume = v;
            }}
            className="w-20 accent-accent h-1"
          />
        </div>

        <select
          value={speed}
          onChange={(e) => {
            const s = Number(e.target.value);
            setSpeed(s);
            audioRef.current.playbackRate = s;
          }}
          className="input py-1 text-xs"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>

        {queue.length > 1 && (
          <button
            onClick={() => setShowQueue((s) => !s)}
            className="text-text-muted hover:text-text"
            title="Queue"
          >
            <ListMusic size={16} />
          </button>
        )}
      </div>

      {showQueue && (
        <div className="max-h-48 overflow-y-auto border-t border-border pt-2 space-y-1">
          {queue.map((q) => (
            <button
              key={q.virtualPath}
              onClick={() => onSelect?.(q)}
              className={`w-full text-left text-xs px-2 py-1.5 rounded-lg truncate ${
                q.virtualPath === entry.virtualPath ? 'bg-accent-soft text-accent' : 'hover:bg-surface-alt'
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
