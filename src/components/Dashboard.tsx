import React, { useState } from 'react';
import { DayUsageStats, LockSession, AppCategoryUsage } from '../types';
import { formatTimeHoursMinutes, formatTimeDetailed } from '../utils/storage';
import {
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle,
  KeyRound,
  Download,
  Calendar,
  Filter,
  Search,
  Activity,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Layers,
  Info,
} from 'lucide-react';

interface DashboardProps {
  todayTotalSeconds: number;
  continuousSeconds: number;
  continuousLimitSeconds: number;
  historicalTrends: DayUsageStats[];
  recentLocks: LockSession[];
  appCategories: AppCategoryUsage[];
  onTriggerLockNow: () => void;
  onNavigateToAgent: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  todayTotalSeconds,
  continuousSeconds,
  continuousLimitSeconds,
  historicalTrends,
  recentLocks,
  appCategories,
  onTriggerLockNow,
  onNavigateToAgent,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(historicalTrends.length - 1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'locked' | 'unlocked_by_code' | 'break_completed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedDay = historicalTrends[selectedDayIndex] || historicalTrends[historicalTrends.length - 1];

  // Filter session logs
  const filteredLocks = recentLocks.filter((lock) => {
    const matchesSearch =
      lock.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lock.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lock.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Session ID', 'Start Time', 'Continuous Duration (s)', 'Break Duration (s)', 'Status', 'Unlocked With Code', 'Reason'];
    const rows = recentLocks.map((l) => [
      l.id,
      l.lockTriggerTime,
      l.continuousDurationSeconds,
      l.breakDurationSeconds,
      l.status,
      l.unlockedWithCode ? 'Yes' : 'No',
      `"${l.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chronosguard_screentime_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Usage statistics exported successfully as CSV.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Continuous timer calculations
  const continuousMinutes = Math.floor(continuousSeconds / 60);
  const continuousSecRemainder = continuousSeconds % 60;
  const continuousPercent = Math.min(100, (continuousSeconds / continuousLimitSeconds) * 100);
  const secondsRemainingUntilLock = Math.max(0, continuousLimitSeconds - continuousSeconds);

  // Maximum value for 7-day bar chart scaling
  const maxDaySeconds = Math.max(...historicalTrends.map((d) => d.totalScreenTimeSeconds), 8 * 3600);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/90 border border-emerald-500/60 text-emerald-100 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 backdrop-blur">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Live Sentinel Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Windows Sentinel Service Active</span>
              <span aria-hidden="true">·</span>
              <span>Process: ChronosGuard.exe</span>
              <span aria-hidden="true">·</span>
              <span>Autostart on Login</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Screen Time &amp; Ergonomic Sentinel Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Monitors daily screen usage on Windows. Continuous usage is capped at 15 minutes, enforcing a mandatory 2-hour rest break unless unlocked with security code 1234567890.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onTriggerLockNow}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Test 15m Lock Screen Now</span>
            </button>
            <button
              onClick={onNavigateToAgent}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <span>Windows Agent Setup</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Live Continuous Gauge Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Current Continuous Screen Session:</span>
              <span className="font-mono text-sky-400 font-bold tabular-nums">
                {continuousMinutes.toString().padStart(2, '0')}:{continuousSecRemainder.toString().padStart(2, '0')} / 15:00
              </span>
              <span className="text-slate-500">({Math.round(continuousPercent)}% towards forced lock)</span>
            </div>
            <div className="text-slate-400 font-mono">
              {secondsRemainingUntilLock > 0 ? (
                <span>{formatTimeDetailed(secondsRemainingUntilLock)} remaining until 2-hour break</span>
              ) : (
                <span className="text-amber-400 font-semibold">15m LIMIT REACHED - LOCK TRIGGERED</span>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                continuousPercent >= 90
                  ? 'bg-rose-500'
                  : continuousPercent >= 70
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-500'
              }`}
              style={{ width: `${continuousPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
            <span>0m (Reset on 60s idle)</span>
            <span>5m warning</span>
            <span>10m reminder</span>
            <span className="text-amber-400 font-semibold">15m Forced 2-Hour Lock</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards, Single Elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Screen Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Today's Total Screen Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {formatTimeHoursMinutes(todayTotalSeconds)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">Nominal</span>
            <span aria-hidden="true">·</span>
            <span>Budget: 8h 00m</span>
          </div>
        </div>

        {/* Card 2: Forced Breaks Triggered */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Forced Breaks Triggered</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {selectedDay.forcedBreaksTriggered}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-slate-300">{selectedDay.breaksCompleted} full 2h breaks</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">{selectedDay.passcodeOverrides} PIN bypass</span>
          </div>
        </div>

        {/* Card 3: Continuous Focus Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Continuous Sessions</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {selectedDay.continuousSessionsCount}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-slate-300">Max limit: 15 min</span>
            <span aria-hidden="true">·</span>
            <span>Idle threshold: 60s</span>
          </div>
        </div>

        {/* Card 4: Break Compliance Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Rest Compliance Score</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {Math.round(
              (selectedDay.breaksCompleted /
                Math.max(1, selectedDay.breaksCompleted + selectedDay.passcodeOverrides)) *
                100
            )}
            %
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">+4%</span>
            <span aria-hidden="true">·</span>
            <span>vs previous 7 days</span>
          </div>
        </div>
      </div>

      {/* Trends Section: 7-Day Bar Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): 7-Day Usage Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h2 className="text-base font-semibold text-white">Daily Screen Time Trends</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Past 7 days showing cumulative screen hours and forced break triggers.
              </p>
            </div>
            
            {/* Interactive Day Selector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              {historicalTrends.map((d, idx) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-2.5 py-1 font-medium rounded transition-colors ${
                    selectedDayIndex === idx
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.dayName}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-3 items-end h-56 pt-6 px-2">
              {historicalTrends.map((day, idx) => {
                const heightPercent = Math.min(100, (day.totalScreenTimeSeconds / maxDaySeconds) * 100);
                const isSelected = selectedDayIndex === idx;
                const hoursVal = (day.totalScreenTimeSeconds / 3600).toFixed(1);

                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDayIndex(idx)}
                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Hover indicator tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded mb-1 text-center whitespace-nowrap shadow">
                      {hoursVal}h · {day.forcedBreaksTriggered} locks
                    </div>

                    {/* Bar Stack */}
                    <div className="w-full max-w-[42px] bg-slate-950 rounded-t-lg overflow-hidden flex flex-col justify-end border border-slate-800">
                      <div
                        className={`w-full transition-all duration-300 rounded-t-md ${
                          isSelected
                            ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-lg shadow-sky-950'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                      />
                    </div>

                    {/* Day label */}
                    <div className="mt-2 text-center">
                      <span className={`text-xs block font-medium ${isSelected ? 'text-sky-400 font-bold' : 'text-slate-400'}`}>
                        {day.dayName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {hoursVal}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Deep Dive Summary */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{selectedDay.date} ({selectedDay.dayName}):</span>
                <span>Total: <strong className="text-white">{formatTimeHoursMinutes(selectedDay.totalScreenTimeSeconds)}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Forced Breaks: <strong className="text-amber-400">{selectedDay.forcedBreaksTriggered}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Code Overrides: <strong className="text-slate-300">{selectedDay.passcodeOverrides}</strong></span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Rule: 15m continuous active → 2h break
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): App & Activity Distribution */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h2 className="text-base font-semibold text-white">Application Categories</h2>
              </div>
              <span className="text-xs text-slate-500">Today</span>
            </div>

            <div className="space-y-3.5">
              {appCategories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[200px]">{cat.category}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {Math.floor(cat.minutes / 60)}h {cat.minutes % 60}m ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Windows Desktop Guard Rule Reference Box */}
          <div className="mt-6 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Forced Lock Mechanism</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              When user activity is detected without interruption for 15 minutes, the desktop is locked for 2 hours. Entering security code <strong className="text-white font-mono">1234567890</strong> permits immediate administrative override.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Session Audit & Break Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Session Audit &amp; Break History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed chronological log of continuous 15-minute intervals and forced lock events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('break_completed')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'break_completed' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full 2h Breaks
              </button>
              <button
                onClick={() => setStatusFilter('unlocked_by_code')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'unlocked_by_code' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Code Overrides
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Session ID</th>
                <th className="py-2.5 px-3">Trigger Time</th>
                <th className="py-2.5 px-3">Continuous Active</th>
                <th className="py-2.5 px-3">Break Mandate</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3 text-right">Unlock Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No session logs match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLocks.map((lock) => (
                  <tr key={lock.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300 font-medium">
                      {lock.id}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(lock.lockTriggerTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 tabular-nums">
                      {Math.floor(lock.continuousDurationSeconds / 60)}m 00s
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-mono tabular-nums">
                      2h 00m
                    </td>
                    <td className="py-3 px-3">
                      {lock.status === 'break_completed' ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Full 2-Hour Rest Completed</span>
                        </span>
                      ) : lock.status === 'unlocked_by_code' ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Bypassed with Code (1234567890)</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Currently Locked</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {lock.unlockedWithCode ? 'PIN 1234567890 Verified' : 'Timer Expired'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
