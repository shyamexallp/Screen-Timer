export interface MinuteActivityPoint {
  minute: number; // 0 to 15
  activeSeconds: number; // 0 to 60
  intensityPercentage: number; // 0 to 100
  inputEvents: number; // simulated or actual key/mouse count
  timestamp: string;
}

export interface LockSession {
  id: string;
  startTime: string; // ISO
  lockTriggerTime: string; // ISO
  continuousDurationSeconds: number; // typically 900s (15 min)
  breakDurationSeconds: number; // 7200s (2 hours)
  breakRemainingSeconds: number;
  totalDaySecondsBeforeLock: number;
  status: 'locked' | 'unlocked_by_code' | 'break_completed';
  unlockTimestamp?: string;
  unlockedWithCode?: boolean;
  activityMinuteProfile: MinuteActivityPoint[];
  reason: string;
}

export interface DayUsageStats {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  totalScreenTimeSeconds: number;
  continuousSessionsCount: number;
  forcedBreaksTriggered: number;
  breaksCompleted: number;
  passcodeOverrides: number;
  longestStreakSeconds: number;
}

export interface AppCategoryUsage {
  category: string;
  minutes: number;
  percentage: number;
  color: string;
}

export interface SystemSettings {
  continuousThresholdMinutes: number; // default 15
  breakDurationMinutes: number; // default 120 (2 hours)
  requiredSecurityCode: string; // "1234567890"
  autostartWithWindows: boolean;
  runSilentlyInTray: boolean;
  soundAlertsEnabled: boolean;
  idleThresholdSeconds: number; // default 60s
  strictMode: boolean; // blocks bypass attempts
}
