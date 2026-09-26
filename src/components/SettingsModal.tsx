import React from 'react';
import { SystemSettings } from '../types';
import { X, Check, Shield, Laptop, Volume2, Clock, Key } from 'lucide-react';

interface SettingsModalProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ChronosGuard Sentinel Settings</h2>
              <p className="text-xs text-slate-400">Configure Windows background rules &amp; security locks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 my-5 text-xs">
          
          {/* Continuous Threshold */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Continuous Screen Time Limit</span>
              </span>
              <span className="font-mono text-sky-400 font-bold">15 Minutes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When user input continues without a 60-second break, screen locks automatically.
            </p>
          </div>

          {/* Forced Break Duration */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Forced Rest Break Mandate</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">2 Hours (120 min)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Locks the computer and blocks inputs until the timer finishes or passcode is provided.
            </p>
          </div>

          {/* Master Unlock Security Passcode */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>Required Security Bypass Code</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold tracking-wider">
                1234567890
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              The lock screen rejects all other inputs and remains active until this code is verified.
            </p>
          </div>

          {/* Windows System Integration */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:bg-slate-950/60 transition-colors">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-200">Start automatically upon Windows login</div>
                  <div className="text-[11px] text-slate-500">Configures HKCU\Software\Microsoft\Windows\CurrentVersion\Run</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autostartWithWindows}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, autostartWithWindows: e.target.checked })
                }
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:bg-slate-950/60 transition-colors">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-200">Audio Chimes on Lock &amp; Unlock</div>
                  <div className="text-[11px] text-slate-500">Play alert gong when 15m reached and success chord on passcode match</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundAlertsEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, soundAlertsEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
