import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDuration } from '../../utils/formatters';
import { isNativelyPlayableVideo } from '../../utils/fileCategory';
import ExternalPlayerActions from './ExternalPlayerActions';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayer({ entry, onNext, onPrevious }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);

  const playable = isNativelyPlayableVideo(entry.name);
  const src = api.streamUrl(entry.virtualPath);

  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [entry.virtualPath]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function seekBy(delta) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), duration);
  }

  function handleScrub(e) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  }

  function toggleFullscreen() {
    const el = videoRef.current?.parentElement;
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function togglePip() {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else v.requestPictureInPicture?.();
  }

  useEffect(() => {
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          seekBy(10);
          break;
        case 'ArrowLeft':
          seekBy(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          setMuted((m) => !m);
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  if (!playable) {
    return (
      <div className="w-full aspect-video bg-black rounded-card flex flex-col items-center justify-center gap-4 text-center p-6">
        <AlertTriangle className="text-amber-400" size={32} />
        <div>
          <p className="font-medium">This format can't be played directly in your browser.</p>
          <p className="text-sm text-text-muted mt-1">
            {entry.extension?.toUpperCase()} containers like this usually need transcoding first.
            Hoster's architecture supports plugging in FFmpeg for this later — for now, open it
            with another player below.
          </p>
        </div>
        <ExternalPlayerActions entry={entry} compact />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-none sm:rounded-card overflow-hidden group touch-manipulation"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black"
        onLoadedMetadata={(e) => {
          setDuration(e.target.duration);
          setLoading(false);
        }}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        onClick={togglePlay}
        autoPlay
      />

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-white text-center px-6 py-8 overflow-y-auto">
          <AlertTriangle size={28} className="text-amber-400 shrink-0" />
          <div>
            <p className="font-medium">Couldn't play this video.</p>
            <p className="text-sm text-white/70 mt-1 max-w-xs">
              The file may use a codec this browser can't decode (common with
              some mp4/H.265 files). Try another player below.
            </p>
          </div>
          <ExternalPlayerActions entry={entry} compact />
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 sm:px-3 pt-8 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="py-2 -my-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={handleScrub}
            className="w-full accent-white h-1.5 cursor-pointer touch-manipulation"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-1 text-white mt-1">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {onPrevious && (
              <IconBtn onClick={onPrevious} icon={SkipBack} title="Previous" />
            )}
            <IconBtn onClick={() => seekBy(-10)} icon={RotateCcw} title="-10s" />
            <IconBtn onClick={togglePlay} icon={playing ? Pause : Play} title="Play/Pause" big />
            <IconBtn onClick={() => seekBy(10)} icon={RotateCw} title="+10s" />
            {onNext && <IconBtn onClick={onNext} icon={SkipForward} title="Next" />}
            <span className="text-[11px] sm:text-xs tabular-nums ml-1 sm:ml-2 whitespace-nowrap">
              {formatDuration(current)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <select
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                if (videoRef.current) videoRef.current.playbackRate = s;
              }}
              className="bg-transparent text-xs border border-white/30 rounded px-1 py-1.5 sm:py-0.5"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}x
                </option>
              ))}
            </select>
            <IconBtn
              onClick={() => {
                setMuted((m) => !m);
                if (videoRef.current) videoRef.current.muted = !muted;
              }}
              icon={muted || volume === 0 ? VolumeX : Volume2}
              title="Mute"
            />
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
                if (videoRef.current) videoRef.current.volume = v;
              }}
              className="w-16 accent-white h-1 hidden sm:block"
            />
            <IconBtn onClick={togglePip} icon={PictureInPicture2} title="Picture-in-picture" />
            <IconBtn
              onClick={() => window.open(api.streamUrl(entry.virtualPath), '_blank', 'noopener,noreferrer')}
              icon={ExternalLink}
              title="Open with another player"
            />
            <IconBtn onClick={toggleFullscreen} icon={Maximize} title="Fullscreen" />
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ onClick, icon: Icon, title, big }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`p-2 sm:p-1.5 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors touch-manipulation ${big ? 'p-2.5 sm:p-2' : ''}`}
    >
      <Icon size={big ? 22 : 18} className="sm:hidden" />
      <Icon size={big ? 20 : 16} className="hidden sm:block" />
    </button>
  );
}
