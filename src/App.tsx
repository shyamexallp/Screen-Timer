import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LockSession,
  DayUsageStats,
  AppCategoryUsage,
  SystemSettings,
  MinuteActivityPoint,
} from './types';
import {
  DEFAULT_SETTINGS,
  generateMinuteProfile,
  getInitialHistoricalTrends,
  getInitialAppCategories,
  getInitialRecentLocks,
} from './utils/storage';
import { soundEffects } from './utils/audio';
import { Dashboard } from './components/Dashboard';
import { LockScreen } from './components/LockScreen';
import { WindowsAgentExporter } from './components/WindowsAgentExporter';
import { SystemTraySimulator } from './components/SystemTraySimulator';
import { SimulationControls } from './components/SimulationControls';
import { SettingsModal } from './components/SettingsModal';
import {
  ShieldAlert,
  BarChart3,
  Laptop,
  Settings,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'trends' | 'agent'>('dashboard');

  // Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('chronosguard_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Runtime State
  const [continuousSeconds, setContinuousSeconds] = useState<number>(11 * 60 + 24); // Start at realistic 11m 24s so user is close to 15m
  const [todayTotalSeconds, setTodayTotalSeconds] = useState<number>(5 * 3600 + 42 * 60);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [currentLockSession, setCurrentLockSession] = useState<LockSession | null>(null);
  const [userIsActive, setUserIsActive] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [historicalTrends, setHistoricalTrends] = useState<DayUsageStats[]>(getInitialHistoricalTrends);
  const [recentLocks, setRecentLocks] = useState<LockSession[]>(getInitialRecentLocks);
  const [appCategories] = useState<AppCategoryUsage[]>(getInitialAppCategories);
  const [recentUnlockNotice, setRecentUnlockNotice] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const continuousLimitSeconds = settings.continuousThresholdMinutes * 60; // 900s = 15 mins
  const breakLimitSeconds = settings.breakDurationMinutes * 60; // 7200s = 2 hours

  // Sync sound settings with audio manager
  useEffect(() => {
    soundEffects.setEnabled(settings.soundAlertsEnabled);
  }, [settings.soundAlertsEnabled]);

  // Save settings to localStorage
  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('chronosguard_settings', JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  // Activity listeners to track real user interactions
  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      setUserIsActive(true);
    };

    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('keydown', markActive, { passive: true });
    window.addEventListener('mousedown', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });
    window.addEventListener('scroll', markActive, { passive: true });

    return () => {
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('scroll', markActive);
    };
  }, []);

  // Function to trigger the forced lock screen
  const triggerForcedLock = useCallback(() => {
    soundEffects.playLockAlert();

    const minuteProfile = generateMinuteProfile(15);
    const newLock: LockSession = {
      id: `lock-${Date.now().toString().slice(-6)}`,
      startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      lockTriggerTime: new Date().toISOString(),
      continuousDurationSeconds: continuousLimitSeconds,
      breakDurationSeconds: breakLimitSeconds,
      breakRemainingSeconds: breakLimitSeconds,
      totalDaySecondsBeforeLock: todayTotalSeconds,
      status: 'locked',
      activityMinuteProfile: minuteProfile,
      reason: 'Continuous screen time threshold of 15 minutes reached.',
    };

    setCurrentLockSession(newLock);
    setIsLocked(true);
    setRecentLocks((prev) => [newLock, ...prev]);

    // Update today's forced break count in trends
    setHistoricalTrends((prev) => {
      const copy = [...prev];
      const today = copy[copy.length - 1];
      if (today) {
        today.forcedBreaksTriggered++;
      }
      return copy;
    });
  }, [breakLimitSeconds, continuousLimitSeconds, todayTotalSeconds]);

  // Unlock with Passcode Handler (Requires "1234567890")
  const handleUnlockWithCode = (code: string): boolean => {
    if (code.trim() === settings.requiredSecurityCode) {
      soundEffects.playUnlockSuccess();
      setIsLocked(false);
      setContinuousSeconds(0);

      if (currentLockSession) {
        setRecentLocks((prev) =>
          prev.map((l) =>
            l.id === currentLockSession.id
              ? {
                  ...l,
                  status: 'unlocked_by_code',
                  unlockTimestamp: new Date().toISOString(),
                  unlockedWithCode: true,
                }
              : l
          )
        );
      }

      // Update override count in trends
      setHistoricalTrends((prev) => {
        const copy = [...prev];
        const today = copy[copy.length - 1];
        if (today) {
          today.passcodeOverrides++;
        }
        return copy;
      });

      setRecentUnlockNotice('Security code "1234567890" accepted. Desktop unlocked successfully!');
      setTimeout(() => setRecentUnlockNotice(null), 4000);
      return true;
    }
    return false;
  };

  // Timer complete after full 2 hours
  const handleBreakTimerComplete = useCallback(() => {
    soundEffects.playUnlockSuccess();
    setIsLocked(false);
    setContinuousSeconds(0);

    if (currentLockSession) {
      setRecentLocks((prev) =>
        prev.map((l) =>
          l.id === currentLockSession.id
            ? {
                ...l,
                status: 'break_completed',
                unlockTimestamp: new Date().toISOString(),
                unlockedWithCode: false,
              }
            : l
        )
      );
    }

    setHistoricalTrends((prev) => {
      const copy = [...prev];
      const today = copy[copy.length - 1];
      if (today) {
        today.breaksCompleted++;
      }
      return copy;
    });

    setRecentUnlockNotice('2-hour rest break completed. Screen unlocked.');
    setTimeout(() => setRecentUnlockNotice(null), 4000);
  }, [currentLockSession]);

  // Core clock loop (ticks every 1s, adjusted by simulation speed)
  useEffect(() => {
    if (isLocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTimeSeconds = (now - lastActivityRef.current) / 1000;

      if (idleTimeSeconds >= settings.idleThresholdSeconds) {
        // User was idle for >= 60 seconds: streak resets
        setUserIsActive(false);
        if (continuousSeconds > 0) {
          setContinuousSeconds(0);
        }
      } else {
        // Active usage: increment continuous screen time
        setUserIsActive(true);
        setContinuousSeconds((prev) => {
          const next = prev + 1 * speedMultiplier;
          if (next >= continuousLimitSeconds) {
            triggerForcedLock();
            return continuousLimitSeconds;
          }
          return next;
        });

        setTodayTotalSeconds((prev) => prev + 1 * speedMultiplier);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, speedMultiplier, continuousLimitSeconds, settings.idleThresholdSeconds, continuousSeconds, triggerForcedLock]);

  // Simulate 60s idle reset
  const handleSimulateIdle = () => {
    lastActivityRef.current = Date.now() - (settings.idleThresholdSeconds + 5) * 1000;
    setContinuousSeconds(0);
    setUserIsActive(false);
    setRecentUnlockNotice('Simulated 60-second idle break: Continuous session reset to 0m.');
    setTimeout(() => setRecentUnlockNotice(null), 3500);
  };

  const handleResetSession = () => {
    setContinuousSeconds(0);
    setRecentUnlockNotice('Continuous screen session reset.');
    setTimeout(() => setRecentUnlockNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Strict 1-Row 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        
        {/* Zone 1: Single text element Brand Wordmark in display face */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-lg font-bold tracking-tight text-white hover:text-sky-400 transition-colors text-left"
        >
          ChronosGuard
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`transition-colors hover:text-white ${
              currentView === 'dashboard' ? 'text-sky-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={triggerForcedLock}
            className="transition-colors hover:text-amber-300 text-amber-400/90 font-medium"
          >
            Screen Lock
          </button>
          <button
            onClick={() => setCurrentView('trends')}
            className={`transition-colors hover:text-white ${
              currentView === 'trends' ? 'text-sky-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Usage Trends
          </button>
          <button
            onClick={() => setCurrentView('agent')}
            className={`transition-colors hover:text-white ${
              currentView === 'agent' ? 'text-sky-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Windows Agent
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Configure Screen Time Rules"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={triggerForcedLock}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Lock Screen
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Floating Success Notice */}
        {recentUnlockNotice && (
          <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{recentUnlockNotice}</span>
            </div>
            <button
              onClick={() => setRecentUnlockNotice(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Interactive Simulation Controller Bar */}
        <SimulationControls
          speedMultiplier={speedMultiplier}
          onSetSpeed={setSpeedMultiplier}
          onTriggerLockNow={triggerForcedLock}
          onSimulateIdle={handleSimulateIdle}
          onResetSession={handleResetSession}
          soundEnabled={settings.soundAlertsEnabled}
          onToggleSound={() =>
            handleUpdateSettings({
              ...settings,
              soundAlertsEnabled: !settings.soundAlertsEnabled,
            })
          }
          userIsActive={userIsActive}
        />

        {/* Dynamic View Display */}
        {currentView === 'dashboard' && (
          <Dashboard
            todayTotalSeconds={todayTotalSeconds}
            continuousSeconds={continuousSeconds}
            continuousLimitSeconds={continuousLimitSeconds}
            historicalTrends={historicalTrends}
            recentLocks={recentLocks}
            appCategories={appCategories}
            onTriggerLockNow={triggerForcedLock}
            onNavigateToAgent={() => setCurrentView('agent')}
          />
        )}

        {currentView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white">Usage Trends &amp; Focus Rhythm</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualizing 24-hour daily timeline distribution between 15-minute work sprints and 2-hour recovery breaks.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>

              {/* 24-Hour Timeline Heatmap */}
              <div className="space-y-3 mt-6">
                <div className="text-xs font-semibold text-slate-300">
                  Today's 24-Hour Activity Timeline (Hour 00:00 to 23:00)
                </div>
                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-2">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const isMorning = hour >= 9 && hour <= 12;
                    const isAfternoon = hour >= 14 && hour <= 18;
                    const isLockedHour = hour === 11 || hour === 15;
                    const isActiveHour = isMorning || isAfternoon;

                    return (
                      <div
                        key={hour}
                        title={`Hour ${hour}:00 - ${
                          isLockedHour
                            ? 'Forced Break Active'
                            : isActiveHour
                            ? 'Continuous Focus Session'
                            : 'Idle'
                        }`}
                        className="group flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <div
                          className={`w-full h-10 rounded transition-all ${
                            isLockedHour
                              ? 'bg-amber-500 shadow-sm shadow-amber-950'
                              : isActiveHour
                              ? 'bg-sky-500 hover:bg-sky-400'
                              : 'bg-slate-800/80 hover:bg-slate-700'
                          }`}
                        />
                        <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-300">
                          {hour}h
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500" />
                    <span>Continuous Screen Time (15m bursts)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span>Forced 2-Hour Break Intervals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-800" />
                    <span>Off-Screen / Idle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Re-use Dashboard's 7-day trend */}
            <Dashboard
              todayTotalSeconds={todayTotalSeconds}
              continuousSeconds={continuousSeconds}
              continuousLimitSeconds={continuousLimitSeconds}
              historicalTrends={historicalTrends}
              recentLocks={recentLocks}
              appCategories={appCategories}
              onTriggerLockNow={triggerForcedLock}
              onNavigateToAgent={() => setCurrentView('agent')}
            />
          </div>
        )}

        {currentView === 'agent' && <WindowsAgentExporter />}
      </main>

      {/* Realistic Windows 11 Taskbar & System Tray Simulator (Fixed at Bottom) */}
      <footer className="sticky bottom-0 z-40">
        <SystemTraySimulator
          continuousSeconds={continuousSeconds}
          continuousLimitSeconds={continuousLimitSeconds}
          isLocked={isLocked}
          onOpenDashboard={() => setCurrentView('dashboard')}
          onTriggerLockNow={triggerForcedLock}
          autostartEnabled={settings.autostartWithWindows}
          onToggleAutostart={() =>
            handleUpdateSettings({
              ...settings,
              autostartWithWindows: !settings.autostartWithWindows,
            })
          }
          soundEnabled={settings.soundAlertsEnabled}
          onToggleSound={() =>
            handleUpdateSettings({
              ...settings,
              soundAlertsEnabled: !settings.soundAlertsEnabled,
            })
          }
        />
      </footer>

      {/* Mandatory 2-Hour Forced Lock Screen (Overlays Everything when Triggered) */}
      {isLocked && (
        <LockScreen
          currentLock={currentLockSession}
          onUnlockWithCode={handleUnlockWithCode}
          onBreakTimerComplete={handleBreakTimerComplete}
          speedMultiplier={speedMultiplier}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
