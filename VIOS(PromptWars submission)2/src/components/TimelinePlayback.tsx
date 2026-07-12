import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Clock } from "lucide-react";
import { StadiumState } from "../types";

interface TimelinePlaybackProps {
  history: StadiumState[];
  onSelectHistoricalState: (index: number) => void;
  currentIndex: number;
}

export default function TimelinePlayback({ history, onSelectHistoricalState, currentIndex }: TimelinePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentIndex < history.length - 1) {
          onSelectHistoricalState(currentIndex + 1);
        } else {
          setIsPlaying(false); // Stop at end of tape
        }
      }, 1500); // 1.5s tick per state step
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, history, onSelectHistoricalState]);

  const handleReset = () => {
    setIsPlaying(false);
    onSelectHistoricalState(0);
  };

  const handleFastForward = () => {
    if (currentIndex < history.length - 1) {
      onSelectHistoricalState(history.length - 1);
    }
  };

  const activeState = history[currentIndex];

  return (
    <div className="tactical-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-orange-500/10">
        <div>
          <h3 className="font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            OPERATIONAL TIMELINE PLAYBACK (REPLAY SYSTEM)
          </h3>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Replay previously logged events and review past AI actions in 5-minute telemetry intervals.
          </p>
        </div>
        {activeState && (
          <div className="font-mono text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-md flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span>PLAYBACK TIMECODE: {activeState.matchTimeLabel}</span>
          </div>
        )}
      </div>

      {/* Control Deck */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-orange-500/10">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset to T-105m"
            className="p-2.5 rounded-lg border border-orange-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-95 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-3.5 rounded-full transition-all active:scale-95 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isPlaying
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-orange-500 text-slate-950 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={handleFastForward}
            title="Fast Forward to Present"
            className="p-2.5 rounded-lg border border-orange-500/20 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-95 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider bar */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="font-mono text-[10px] text-slate-500">T-105m</span>
          <div className="relative flex-1 flex items-center">
            {/* Visual Markers for intervals */}
            <div className="absolute inset-x-0 h-1 bg-slate-850 rounded-full" />
            {/* Active scrub range */}
            <div
              className="absolute h-1 bg-orange-500 rounded-full"
              style={{ width: `${(currentIndex / (history.length - 1)) * 100}%` }}
            />
            {/* Range slider */}
            <input
              type="range"
              min="0"
              max={history.length - 1}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                onSelectHistoricalState(parseInt(e.target.value));
              }}
              className="w-full h-4 opacity-0 cursor-pointer z-10"
            />
            {/* Handle visual */}
            <div
              className="absolute w-4 h-4 bg-slate-100 rounded-full border-2 border-orange-500 shadow-lg pointer-events-none transition-all duration-75"
              style={{ left: `calc(${(currentIndex / (history.length - 1)) * 100}% - 8px)` }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-500">PRESENT</span>
        </div>

        {/* Playback Stats Indicator */}
        <div className="font-mono text-[11px] text-slate-400 flex gap-4 border-l border-orange-500/15 pl-4">
          <div>
            <span className="text-slate-600 mr-1">SPECTATORS:</span>
            <span className="text-slate-200 font-bold">
              {activeState?.spectatorsInStadium.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-600 mr-1">SCENARIO:</span>
            <span className="text-orange-400 uppercase font-bold">{activeState?.scenario}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
