'use client';
import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (played: number, playedSeconds: number) => void;
}

export function VideoPlayer({ url, title, onProgress }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide controls after 2 seconds of inactivity
  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleMouseMove = () => {
    if (!showControls) setShowControls(true);
  };

  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    onProgress?.(state.playedSeconds, duration);
  };

  const handleDuration = (d: any) => setDuration(d);

  const togglePlay = () => setPlaying(!playing);
  const toggleMute = () => setMuted(!muted);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    setPlayedSeconds(seekTo);
    playerRef.current?.seekTo(seekTo);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekBackward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(Math.max(0, currentTime - 10));
  };

  const seekForward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(Math.min(duration, currentTime + 10));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn("Fullscreen request failed", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.warn("Exit fullscreen failed", err);
      });
    }
  };

  const progressPercent = duration > 0 ? (playedSeconds / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <Player
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onDuration={handleDuration}
        onBuffer={() => setBuffering(true)}
        onBufferEnd={() => setBuffering(false)}
        config={{
          youtube: { playerVars: { modestbranding: 1, rel: 0 } }
        }}
      />

      {/* Customized Video Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Video Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white text-lg font-semibold drop-shadow-lg">
            {title}
          </div>
        )}

        {/* Big Center Play/Pause Toggle */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
        >
          {playing ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white" />}
        </button>

        {/* Bottom Progress Bar & Telemetry Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={playedSeconds}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
            <div className="absolute top-0 left-0 h-1 bg-gold rounded-lg pointer-events-none" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={togglePlay} className="text-white hover:text-gold transition cursor-pointer">
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button type="button" onClick={seekBackward} className="text-white hover:text-gold transition cursor-pointer">
                <SkipBack size={20} />
              </button>
              <button type="button" onClick={seekForward} className="text-white hover:text-gold transition cursor-pointer">
                <SkipForward size={20} />
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button type="button" onClick={toggleMute} className="text-white hover:text-gold transition cursor-pointer">
                  {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <span className="text-white text-sm font-mono">
                {formatTime(playedSeconds)} / {formatTime(duration)}
              </span>
            </div>

            <button type="button" onClick={toggleFullscreen} className="text-white hover:text-gold transition cursor-pointer">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Buffering Indicator */}
      {buffering && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
