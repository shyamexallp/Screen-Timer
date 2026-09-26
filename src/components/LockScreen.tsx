import React, { useState, useEffect, useRef } from 'react';
import { LockSession } from '../types';
import { soundEffects } from '../utils/audio';
import {
  ShieldAlert,
  Clock,
  KeyRound,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Coffee,
  HelpCircle,
} from 'lucide-react';

interface LockScreenProps {
  currentLock: LockSession | null;
  onUnlockWithCode: (code: string) => boolean;
  onBreakTimerComplete: () => void;
  speedMultiplier: number;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  currentLock,
  onUnlockWithCode,
  onBreakTimerComplete,
  speedMultiplier,
}) => {
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showCodePlaintext, setShowCodePlaintext] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    currentLock ? currentLock.breakRemainingSeconds : 7200
  );
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showHelpHint, setShowHelpHint] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync remaining seconds if currentLock changes
  useEffect(() => {
    if (currentLock) {
      setRemainingSeconds(currentLock.breakRemainingSeconds);
    }
  }, [currentLock]);

  // Countdown timer loop for the 2-hour break
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1 * speedMultiplier;
        if (next <= 0) {
          clearInterval(timer);
          onBreakTimerComplete();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [speedMultiplier, onBreakTimerComplete]);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Format 2-hour countdown
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  const formattedCountdown = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const breakTotalSeconds = currentLock?.breakDurationSeconds || 7200;
  const breakProgressPercent = Math.min(
    100,
    Math.max(0, ((breakTotalSeconds - remainingSeconds) / breakTotalSeconds) * 100)
  );

  const handleKeypadPress = (digit: string) => {
    soundEffects.playKeyClick();
    setErrorMessage('');
    if (enteredCode.length < 15) {
      setEnteredCode((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    soundEffects.playKeyClick();
    setErrorMessage('');
    setEnteredCode((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundEffects.playKeyClick();
    setErrorMessage('');
    setEnteredCode('');
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredCode) {
      setErrorMessage('Please enter the security unlock code.');
      soundEffects.playErrorBuzz();
      return;
    }

    const success = onUnlockWithCode(enteredCode);
    if (!success) {
      soundEffects.playErrorBuzz();
      setIsShaking(true);
      setErrorMessage('Invalid Security Code! Screen will NOT unlock until code "1234567890" is given.');
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  const fillMasterCode = () => {
    soundEffects.playKeyClick();
    setEnteredCode('1234567890');
    setErrorMessage('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Activity profile data for the 15-minute lock screen chart
  const profile = currentLock?.activityMinuteProfile || [];
  const svgWidth = 620;
  const svgHeight = 170;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Build SVG polygon points for the 15-minute chart
  const pointsString = profile.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(1, profile.length - 1)) * plotWidth;
    const y = svgHeight - paddingY - (pt.intensityPercentage / 100) * plotHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaString = profile.length > 0
    ? `${paddingX},${svgHeight - paddingY} ${pointsString} ${paddingX + plotWidth},${svgHeight - paddingY}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto select-none bg-slate-950 text-slate-100 p-4 sm:p-6 backdrop-blur-2xl">
      {/* Background wallpaper with deep dark vignette scrim */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/src/assets/images/lockscreen_wallpaper_1790387778596.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/95 to-slate-950 pointer-events-none" />

      {/* Top Bar inside Lock Screen */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between mb-4 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-semibold text-red-400 tracking-wide">WINDOWS SENTINEL LOCK ACTIVE</span>
          <span className="text-slate-600">|</span>
          <span>Continuous Threshold: 15 minutes reached</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Toggle Fullscreen Lock Simulation"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Lock'}</span>
          </button>
        </div>
      </div>

      {/* Main Lock Container */}
      <div className="relative z-10 w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
        
        {/* Urgent Break Notification Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Mandatory Ergonomic Break</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">Continuous Screen Time: 15m reached</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Take a Break for 2 Hours
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Your computer has been continuously in use for 15 minutes without an idle interval. To prevent digital eye fatigue, tension, and protect physical health, this system is now locked.
              </p>
            </div>
          </div>

          {/* 2-Hour Remaining Countdown Clock */}
          <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl px-5 py-3.5 text-center min-w-[210px] shrink-0 self-stretch sm:self-auto flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Forced Break Countdown</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-amber-300 tabular-nums">
              {formattedCountdown}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-1000 rounded-full"
                style={{ width: `${breakProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Middle Section: Chart of 15m Time Spent & Security Code Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Left Column (7 cols): The 15m Continuous Screen Time Chart */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">
                  Screen Time Spent Before Forced Break
                </h2>
              </div>
              <span className="text-xs text-sky-400/90 font-mono">15m Continuous Streak</span>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative bg-slate-950/90 border border-slate-800 rounded-xl p-3 pt-4 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-2">
                <span>Input Activity Intensity (0–100%)</span>
                <span>Session Timeline: 0m to 15m (Locked)</span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-44 overflow-visible"
                >
                  <defs>
                    <linearGradient id="lockChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                      <stop offset="70%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lockLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="70%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((level) => {
                    const y = svgHeight - paddingY - level * plotHeight;
                    return (
                      <g key={level}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={paddingX + plotWidth}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          fontSize="9"
                          fill="#64748b"
                          textAnchor="end"
                          className="font-mono tabular-nums"
                        >
                          {Math.round(level * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area */}
                  {areaString && (
                    <polygon points={areaString} fill="url(#lockChartGradient)" />
                  )}

                  {/* The continuous line path */}
                  {pointsString && (
                    <polyline
                      fill="none"
                      stroke="url(#lockLineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsString}
                    />
                  )}

                  {/* Vertical 15-Minute Threshold Cutoff Line */}
                  <line
                    x1={paddingX + plotWidth}
                    y1={paddingY - 8}
                    x2={paddingX + plotWidth}
                    y2={svgHeight - paddingY}
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={paddingX + plotWidth - 62}
                    y={paddingY - 14}
                    width="62"
                    height="18"
                    rx="4"
                    fill="#f43f5e"
                  />
                  <text
                    x={paddingX + plotWidth - 31}
                    y={paddingY - 2}
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    15m FORCED
                  </text>

                  {/* Data Points */}
                  {profile.map((pt, idx) => {
                    const x = paddingX + (idx / Math.max(1, profile.length - 1)) * plotWidth;
                    const y = svgHeight - paddingY - (pt.intensityPercentage / 100) * plotHeight;
                    const isHovered = hoveredPointIndex === idx;
                    const isLast = idx === profile.length - 1;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isLast ? 5 : isHovered ? 4.5 : 3}
                          fill={isLast ? '#f43f5e' : '#38bdf8'}
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        {/* Minute labels on X axis */}
                        {(idx % 3 === 0 || isLast) && (
                          <text
                            x={x}
                            y={svgHeight - paddingY + 16}
                            fontSize="9"
                            fill="#64748b"
                            textAnchor="middle"
                            className="font-mono tabular-nums"
                          >
                            {pt.minute}m
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Hover Tooltip or Selected Minute Info */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                {hoveredPointIndex !== null && profile[hoveredPointIndex] ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sky-300 font-medium">
                      Minute {profile[hoveredPointIndex].minute}:00
                    </span>
                    <span>
                      Intensity: <strong className="text-white">{profile[hoveredPointIndex].intensityPercentage}%</strong>
                    </span>
                    <span>
                      Keystrokes & Clicks: <strong className="text-white">{profile[hoveredPointIndex].inputEvents}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Hover points to view minute-by-minute keystrokes and activity before lock.
                  </div>
                )}
                <span className="text-[11px] text-emerald-400/90 font-mono">
                  Continuous Duration: 15m 00s
                </span>
              </div>
            </div>

            {/* Quick Health & Ergonomics Tips during the 2-Hour Break */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3">
                <Coffee className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Hydration & Movement</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Drink a glass of water, stand up, and gently stretch your back and neck muscles.
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3">
                <Eye className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">20-20-20 Eye Rest</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Look away from digital screens at an object 20 feet away to relax ocular muscles.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Security Passcode Input & Keypad (Required: 1234567890) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Security Unlock Bypass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpHint(!showHelpHint)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Security Passcode Requirements"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {showHelpHint && (
              <div className="mt-2 p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/50 text-[11px] text-sky-300">
                Security requirement: The system remains locked and does not permit user activity until the security code <strong>1234567890</strong> is entered, or until the 2-hour break timer completes.
              </div>
            )}

            {/* Passcode input display */}
            <form onSubmit={handleVerify} className="mt-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showCodePlaintext ? 'text' : 'password'}
                  value={enteredCode}
                  onChange={(e) => {
                    setErrorMessage('');
                    setEnteredCode(e.target.value);
                  }}
                  placeholder="Enter security code"
                  className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    errorMessage ? 'border-red-500/80 bg-red-950/20' : 'border-slate-700'
                  } ${isShaking ? 'animate-bounce' : ''}`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCodePlaintext(!showCodePlaintext)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showCodePlaintext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2 px-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Quick Fill Master Code Helper Button */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-slate-400">Required PIN: 1234567890</span>
                <button
                  type="button"
                  onClick={fillMasterCode}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill Code "1234567890"</span>
                </button>
              </div>

              {/* On-Screen Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-lg font-mono font-medium text-slate-200 transition-colors shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 rounded-lg bg-slate-900/60 hover:bg-red-950/40 border border-slate-800 text-xs font-semibold text-red-400 transition-colors"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-lg font-mono font-medium text-slate-200 transition-colors shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-11 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 transition-colors"
                >
                  ⌫ DEL
                </button>
              </div>

              {/* Submit Unlock Button */}
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify &amp; Unlock Screen</span>
              </button>
            </form>
          </div>
        </div>

        {/* Lock Screen Bottom Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            ChronosGuard Windows Agent · Silently monitoring background idle time via Win32 API.
          </span>
          <span className="text-slate-400">
            Forced break will automatically dismiss after 2 hours (or instantly with security code 1234567890).
          </span>
        </div>
      </div>
    </div>
  );
};
