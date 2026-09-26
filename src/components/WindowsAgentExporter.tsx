import React, { useState } from 'react';
import {
  POWERSHELL_AGENT_SCRIPT,
  BATCH_INSTALLER,
  BATCH_UNINSTALLER,
  ELECTRON_MAIN_JS,
} from '../utils/windowsScripts';
import {
  Download,
  Copy,
  Check,
  Terminal,
  FileCode,
  ShieldCheck,
  Laptop,
  Play,
  Key,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const WindowsAgentExporter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'powershell' | 'installer' | 'uninstaller' | 'electron'>('powershell');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setDownloadToast(`Downloaded ${filename} successfully!`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent =
    activeTab === 'powershell'
      ? POWERSHELL_AGENT_SCRIPT
      : activeTab === 'installer'
      ? BATCH_INSTALLER
      : activeTab === 'uninstaller'
      ? BATCH_UNINSTALLER
      : ELECTRON_MAIN_JS;

  const currentFilename =
    activeTab === 'powershell'
      ? 'ChronosGuard_Daemon.ps1'
      : activeTab === 'installer'
      ? 'Install-ChronosGuard.bat'
      : activeTab === 'uninstaller'
      ? 'Uninstall-ChronosGuard.bat'
      : 'main.js';

  return (
    <div className="space-y-6">
      {/* Download Alert Toast */}
      {downloadToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/90 border border-emerald-500/60 text-emerald-100 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 backdrop-blur">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-sky-400 mb-1">
              <Laptop className="w-4 h-4" />
              <span>Native Microsoft Windows Desktop Agent Package</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Install ChronosGuard on Microsoft Windows
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Get the native background agent files. The agent monitors screen activity using native Win32 APIs, lives silently in the Windows System Tray, starts automatically upon login, triggers a 2-hour lock after 15 continuous minutes, and verifies security code <strong>1234567890</strong>.
            </p>
          </div>

          {/* Quick 1-Click Install Button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => downloadFile('Install-ChronosGuard.bat', BATCH_INSTALLER)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download 1-Click Installer (.bat)</span>
            </button>
            <button
              onClick={() => downloadFile('ChronosGuard_Daemon.ps1', POWERSHELL_AGENT_SCRIPT)}
              className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-2"
            >
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>Download PowerShell Agent (.ps1)</span>
            </button>
          </div>
        </div>

        {/* Feature Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">Continuous Screen Threshold</div>
            <div className="text-white font-semibold font-mono text-sm mt-0.5">15 Minutes</div>
            <div className="text-[11px] text-slate-500 mt-1">Idle reset threshold: 60 seconds</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">Forced Rest Break</div>
            <div className="text-amber-400 font-semibold font-mono text-sm mt-0.5">2 Hours (120m)</div>
            <div className="text-[11px] text-slate-500 mt-1">Topmost lock screen overlay</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">Master Security Passcode</div>
            <div className="text-emerald-400 font-semibold font-mono text-sm mt-0.5">1234567890</div>
            <div className="text-[11px] text-slate-500 mt-1">Required to unlock before 2h</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-slate-400">System Integration</div>
            <div className="text-sky-400 font-semibold text-sm mt-0.5">Windows System Tray</div>
            <div className="text-[11px] text-slate-500 mt-1">HKCU Run Registry Autostart</div>
          </div>
        </div>
      </div>

      {/* 3-Step Windows Quick Installation Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-4">
          Quick Setup Guide for Windows 10 &amp; Windows 11
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[11px]">
                1
              </span>
              <span className="font-semibold text-white">Download Agent Files</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Download <strong>Install-ChronosGuard.bat</strong> and <strong>ChronosGuard_Daemon.ps1</strong> to your Downloads folder or any temporary directory.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[11px]">
                2
              </span>
              <span className="font-semibold text-white">Execute Installer</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Double-click <strong>Install-ChronosGuard.bat</strong>. It registers the Windows Startup registry entry so it automatically starts on user login, and launches the silent daemon.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[11px]">
                3
              </span>
              <span className="font-semibold text-white">Silent Tray Monitoring</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              ChronosGuard appears in your Windows notification tray. When continuous active screen usage reaches 15 minutes, the 2-hour lock screen pops up requiring security code <strong>1234567890</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector & Direct Download Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Script &amp; Source Code Inspector</h3>
          </div>

          {/* File selector tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('powershell')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'powershell'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PowerShell Daemon (.ps1)
            </button>
            <button
              onClick={() => setActiveTab('installer')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'installer'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1-Click Batch Installer (.bat)
            </button>
            <button
              onClick={() => setActiveTab('uninstaller')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'uninstaller'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Uninstaller (.bat)
            </button>
            <button
              onClick={() => setActiveTab('electron')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'electron'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Electron Main.js
            </button>
          </div>
        </div>

        {/* Action Header for active tab */}
        <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>{currentFilename}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(currentContent)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => downloadFile(currentFilename, currentContent)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[460px]">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            <code>{currentContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
