import { LockSession, DayUsageStats, AppCategoryUsage, SystemSettings, MinuteActivityPoint } from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  continuousThresholdMinutes: 15,
  breakDurationMinutes: 120, // 2 hours
  requiredSecurityCode: '1234567890',
  autostartWithWindows: true,
  runSilentlyInTray: true,
  soundAlertsEnabled: true,
  idleThresholdSeconds: 60,
  strictMode: true,
};

// Generates an authentic 15-minute minute-by-minute activity timeline leading to the lock
export function generateMinuteProfile(targetMinutes = 15): MinuteActivityPoint[] {
  const points: MinuteActivityPoint[] = [];
  const baseTimestamp = Date.now() - targetMinutes * 60 * 1000;

  for (let m = 0; m <= targetMinutes; m++) {
    // Generate realistic variance in activity intensity leading up to minute 15
    const variance = Math.sin((m / targetMinutes) * Math.PI) * 25 + 65;
    const intensity = Math.min(100, Math.max(30, Math.round(variance + (Math.random() * 16 - 8))));
    const inputEvents = Math.round(intensity * 1.8 + Math.random() * 20);

    const pointTime = new Date(baseTimestamp + m * 60 * 1000);
    const timeStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    points.push({
      minute: m,
      activeSeconds: m === targetMinutes ? 60 : 60,
      intensityPercentage: intensity,
      inputEvents,
      timestamp: timeStr,
    });
  }

  return points;
}

export function getInitialHistoricalTrends(): DayUsageStats[] {
  return [
    {
      date: '2026-09-19',
      dayName: 'Sat',
      totalScreenTimeSeconds: 4 * 3600 + 15 * 60,
      continuousSessionsCount: 12,
      forcedBreaksTriggered: 5,
      breaksCompleted: 4,
      passcodeOverrides: 1,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-20',
      dayName: 'Sun',
      totalScreenTimeSeconds: 3 * 3600 + 40 * 60,
      continuousSessionsCount: 9,
      forcedBreaksTriggered: 4,
      breaksCompleted: 3,
      passcodeOverrides: 1,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-21',
      dayName: 'Mon',
      totalScreenTimeSeconds: 7 * 3600 + 10 * 60,
      continuousSessionsCount: 22,
      forcedBreaksTriggered: 8,
      breaksCompleted: 6,
      passcodeOverrides: 2,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-22',
      dayName: 'Tue',
      totalScreenTimeSeconds: 6 * 3600 + 50 * 60,
      continuousSessionsCount: 19,
      forcedBreaksTriggered: 7,
      breaksCompleted: 6,
      passcodeOverrides: 1,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-23',
      dayName: 'Wed',
      totalScreenTimeSeconds: 8 * 3600 + 0 * 60,
      continuousSessionsCount: 24,
      forcedBreaksTriggered: 9,
      breaksCompleted: 7,
      passcodeOverrides: 2,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-24',
      dayName: 'Thu',
      totalScreenTimeSeconds: 6 * 3600 + 20 * 60,
      continuousSessionsCount: 18,
      forcedBreaksTriggered: 6,
      breaksCompleted: 5,
      passcodeOverrides: 1,
      longestStreakSeconds: 900,
    },
    {
      date: '2026-09-25',
      dayName: 'Today',
      totalScreenTimeSeconds: 5 * 3600 + 42 * 60,
      continuousSessionsCount: 16,
      forcedBreaksTriggered: 5,
      breaksCompleted: 4,
      passcodeOverrides: 1,
      longestStreakSeconds: 900,
    },
  ];
}

export function getInitialAppCategories(): AppCategoryUsage[] {
  return [
    { category: 'Code & Development (VS Code / Terminal)', minutes: 164, percentage: 48, color: '#38bdf8' },
    { category: 'Browser & Research (Edge / Chrome)', minutes: 86, percentage: 25, color: '#818cf8' },
    { category: 'Productivity & Office (Docs / Excel)', minutes: 48, percentage: 14, color: '#34d399' },
    { category: 'Communication (Teams / Slack)', minutes: 31, percentage: 9, color: '#fbbf24' },
    { category: 'System Tools & Windows Settings', minutes: 13, percentage: 4, color: '#94a3b8' },
  ];
}

export function getInitialRecentLocks(): LockSession[] {
  return [
    {
      id: 'lock-20260925-1530',
      startTime: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      lockTriggerTime: new Date(Date.now() - 3.25 * 3600 * 1000).toISOString(),
      continuousDurationSeconds: 900,
      breakDurationSeconds: 7200,
      breakRemainingSeconds: 0,
      totalDaySecondsBeforeLock: 4 * 3600 + 12 * 60,
      status: 'break_completed',
      unlockTimestamp: new Date(Date.now() - 1.25 * 3600 * 1000).toISOString(),
      unlockedWithCode: false,
      activityMinuteProfile: generateMinuteProfile(15),
      reason: 'Continuous 15-minute screen time reached without 60s idle reset.',
    },
    {
      id: 'lock-20260925-1115',
      startTime: new Date(Date.now() - 7.5 * 3600 * 1000).toISOString(),
      lockTriggerTime: new Date(Date.now() - 7.25 * 3600 * 1000).toISOString(),
      continuousDurationSeconds: 900,
      breakDurationSeconds: 7200,
      breakRemainingSeconds: 6120,
      totalDaySecondsBeforeLock: 2 * 3600 + 40 * 60,
      status: 'unlocked_by_code',
      unlockTimestamp: new Date(Date.now() - 7.07 * 3600 * 1000).toISOString(),
      unlockedWithCode: true,
      activityMinuteProfile: generateMinuteProfile(15),
      reason: 'Urgent deadline bypass with security code 1234567890.',
    },
    {
      id: 'lock-20260925-0900',
      startTime: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      lockTriggerTime: new Date(Date.now() - 9.75 * 3600 * 1000).toISOString(),
      continuousDurationSeconds: 900,
      breakDurationSeconds: 7200,
      breakRemainingSeconds: 0,
      totalDaySecondsBeforeLock: 1 * 3600 + 15 * 60,
      status: 'break_completed',
      unlockTimestamp: new Date(Date.now() - 7.75 * 3600 * 1000).toISOString(),
      unlockedWithCode: false,
      activityMinuteProfile: generateMinuteProfile(15),
      reason: 'Scheduled morning continuous threshold reached.',
    },
  ];
}

export function formatTimeHoursMinutes(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeDetailed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
