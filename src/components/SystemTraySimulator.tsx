import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Clock,
  Play,
  Pause,
  Lock,
  Settings,
  X,
  Check,
  ChevronUp,
  Volume2,
  VolumeX,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { formatTimeDetailed } from '../utils/storage';

interface SystemTraySimulatorProps {
  continuousSeconds: number;
  continuousLimitSeconds: number;
  isLocked: boolean;
  onOpenDashboard: () => void;
  onTriggerLockNow: () => void;
  autostartEnabled: boolean;
  onToggleAutostart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SystemTraySimulator: React.FC<SystemTraySimulatorProps> = ({
  continuousSeconds,
  continuousLimitSeconds,
  isLocked,
  onOpenDashboard,
  onTriggerLockNow,
  autostartEnabled,
  onToggleAutostart,
  soundEnabled,
  onToggleSound,
}) => {
  const [showFlyout, setShowFlyout] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextPos, setContextPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  const trayRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      );
      setCurrentDateStr(
        now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setShowFlyout(false);
        setShowContextMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleTrayRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFlyout(false);
    setShowContextMenu(true);
    setContextPos({ x: Math.max(10, e.clientX - 160), y: Math.max(10, e.clientY - 210) });
  };

  const handleTrayLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setShowFlyout(!showFlyout);
  };

  const continuousMins = Math.floor(continuousSeconds / 60);
  const continuousSecs = continuousSeconds % 60;
  const remainingUntilLock = Math.max(0, continuousLimitSeconds - continuousSeconds);
  const progressPercent = Math.min(100, (continuousSeconds / continuousLimitSeconds) * 100);

  return (
    <div ref={trayRef} className="relative select-none">
      {/* Windows 11 System Tray Flyout Window */}
      {showFlyout && (
        <div className="absolute right-2 bottom-12 z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-4 text-slate-200 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-white leading-tight">ChronosGuard Sentinel</div>
                <div className="text-[10px] text-slate-400">Windows Silent Tray Agent</div>
              </div>
            </div>
            <button
              onClick={() => setShowFlyout(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Continuous Screen Time Meter */}
          <div className="my-3.5 bg-slate-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400">Continuous Screen Time</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">
                {continuousMins}m {continuousSecs.toString().padStart(2, '0')}s / 15m
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent >= 80 ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>{formatTimeDetailed(remainingUntilLock)} until 2-hour forced lock</span>
              <span className="text-emerald-400 font-mono">Idle resets at 60s</span>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-1.5">
            <button
              onClick={() => {
                setShowFlyout(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 transition-colors text-left font-medium text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Open Usage Dashboard</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => {
                setShowFlyout(false);
                onTriggerLockNow();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 transition-colors text-left font-medium text-amber-200"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Trigger 2-Hour Lock Now</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-300">
                1234567890
              </span>
            </button>

            <button
              onClick={onToggleAutostart}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left text-slate-300"
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Autostart on Windows Login</span>
              </div>
              {autostartEnabled ? (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Disabled</span>
              )}
            </button>

            <button
              onClick={onToggleSound}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left text-slate-300"
            >
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Sound Chime on Lock / Unlock</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {soundEnabled ? 'Active' : 'Muted'}
              </span>
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Right-click tray icon for standard Windows context menu
          </div>
        </div>
      )}

      {/* Windows Context Menu (Right Click) */}
      {showContextMenu && (
        <div
          className="fixed z-50 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 text-slate-200 text-xs backdrop-blur-md"
          style={{ left: `${contextPos.x}px`, top: `${contextPos.y}px` }}
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            ChronosGuard Sentinel
          </div>
          <button
            onClick={() => {
              setShowContextMenu(false);
              onOpenDashboard();
            }}
            className="w-full px-3 py-1.5 hover:bg-sky-600 hover:text-white text-left transition-colors flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Dashboard</span>
          </button>
          <button
            onClick={() => {
              setShowContextMenu(false);
              onTriggerLockNow();
            }}
            className="w-full px-3 py-1.5 hover:bg-amber-600 hover:text-white text-left transition-colors flex items-center gap-2 text-amber-300"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Screen for 2 Hours</span>
          </button>
          <div className="h-px bg-slate-800 my-1" />
          <button
            onClick={() => {
              onToggleAutostart();
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors flex items-center justify-between"
          >
            <span>Run on Windows Startup</span>
            {autostartEnabled && <Check className="w-3.5 h-3.5 text-sky-400" />}
          </button>
          <button
            onClick={() => {
              onToggleSound();
            }}
            className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition-colors flex items-center justify-between"
          >
            <span>Alert Chime</span>
            {soundEnabled && <Check className="w-3.5 h-3.5 text-sky-400" />}
          </button>
          <div className="h-px bg-slate-800 my-1" />
          <div className="px-3 py-1 text-[10px] text-slate-500">
            Security PIN: 1234567890
          </div>
          <button
            onClick={() => setShowContextMenu(false)}
            className="w-full px-3 py-1.5 hover:bg-red-900/60 hover:text-red-200 text-left transition-colors text-slate-400"
          >
            Close Menu
          </button>
        </div>
      )}

      {/* Realistic Windows 11 Taskbar Bar Container */}
      <div className="w-full bg-slate-900/95 border-t border-slate-800/90 px-4 py-2 flex items-center justify-between backdrop-blur-md">
        
        {/* Left: Windows Simulation Label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {/* Windows 11 Logo SVG */}
            <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75V22.1L0 20.751M10.949 12.6H24V24l-13.051-1.8" />
            </svg>
            <span className="font-semibold text-slate-300">Windows Background Sentinel</span>
            <span className="text-slate-600">|</span>
            <span className="hidden sm:inline text-[11px] text-slate-500">Running silently in System Tray</span>
          </div>
        </div>

        {/* Right: Windows System Tray & Clock Area */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Chevron for hidden icons */}
          <div className="p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-400">
            <ChevronUp className="w-3.5 h-3.5" />
          </div>

          {/* CHRONOSGUARD TRAY ICON */}
          <div
            onClick={handleTrayLeftClick}
            onContextMenu={handleTrayRightClick}
            title={`ChronosGuard: ${continuousMins}m ${continuousSecs}s continuous (15m limit)\nClick for quick menu · Right-click for options`}
            className="relative px-2 py-1 rounded hover:bg-slate-800/90 active:bg-slate-700/80 cursor-pointer flex items-center gap-1.5 transition-colors group"
          >
            {/* Shield Icon with active pulse */}
            <div className="relative">
              <Shield className="w-4 h-4 text-sky-400 group-hover:text-sky-300" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>

            {/* Continuous active timer preview right on tray */}
            <span className="text-[11px] font-mono text-slate-300 font-semibold tabular-nums">
              {continuousMins}m{continuousSecs.toString().padStart(2, '0')}s
            </span>

            {/* Visual warning dot if > 12 minutes */}
            {continuousMins >= 12 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Windows Clock & Date */}
          <div
            onClick={onOpenDashboard}
            className="px-2 py-0.5 rounded hover:bg-slate-800/80 cursor-pointer text-right transition-colors"
          >
            <div className="text-[11px] font-medium text-slate-200 font-mono leading-tight">
              {currentTimeStr}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {currentDateStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
