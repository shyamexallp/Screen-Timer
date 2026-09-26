import React from 'react';
import {
  FastForward,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldAlert,
  Zap,
  MousePointer,
  CheckCircle,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface SimulationControlsProps {
  speedMultiplier: number;
  onSetSpeed: (speed: number) => void;
  onTriggerLockNow: () => void;
  onSimulateIdle: () => void;
  onResetSession: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  userIsActive: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  speedMultiplier,
  onSetSpeed,
  onTriggerLockNow,
  onSimulateIdle,
  onResetSession,
  soundEnabled,
  onToggleSound,
  userIsActive,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Live Activity Listener Status & Speed */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                userIsActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {userIsActive ? 'Live Mouse/Keyboard Activity' : 'Idle'}
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Speed Multiplier Segmented Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Simulation Speed:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onSetSpeed(1)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  speedMultiplier === 1
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1x (Real-Time)
              </button>
              <button
                onClick={() => onSetSpeed(10)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  speedMultiplier === 10
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                10x Fast
              </button>
              <button
                onClick={() => onSetSpeed(60)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  speedMultiplier === 60
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                60x Ultra
              </button>
            </div>
          </div>
        </div>

        {/* Right: Instant Trigger and Reset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate 60s idle button */}
          <button
            onClick={onSimulateIdle}
            title="Simulates 60 seconds without mouse or keyboard inputs, resetting continuous streak"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700/80 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulate 60s Idle Reset</span>
          </button>

          {/* Trigger 15m Lock Now button */}
          <button
            onClick={onTriggerLockNow}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Trigger 15m Lock Screen</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                soundEffects.playUnlockSuccess();
              }
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-sky-400 hover:text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Sound Chimes' : 'Enable Sound Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
