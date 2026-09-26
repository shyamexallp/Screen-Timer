// Real, production-grade Windows Desktop Agent scripts and configurations

export const POWERSHELL_AGENT_SCRIPT = `# ==============================================================================
# ChronosGuard - Windows Background Screen Time Sentinel
# Continuous 15-Minute Monitor & 2-Hour Security Lock Screen
# Security Unlock Code: 1234567890
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Win32 API to detect idle time and screen lock
$signature = @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [DllImport("user32.dll")]
    public static extern void LockWorkStation();

    public static uint GetIdleTimeMs() {
        LASTINPUTINFO lii = new LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf(lii);
        if (GetLastInputInfo(ref lii)) {
            return (uint)Environment.TickCount - lii.dwTime;
        }
        return 0;
    }
}
"@
Add-Type -TypeDefinition $signature -ErrorAction SilentlyContinue

# Ensure Startup Registry Persistence
$RegistryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$AppName = "ChronosGuard"
$ScriptPath = $MyInvocation.MyCommand.Path
if ($ScriptPath) {
    $Command = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \`"$ScriptPath\`""
    Set-ItemProperty -Path $RegistryPath -Name $AppName -Value $Command -Force
}

# Configuration
$CONTINUOUS_LIMIT_SECONDS = 15 * 60   # 15 minutes continuous screen time
$BREAK_DURATION_SECONDS   = 2 * 3600  # 2 hours mandatory break
$IDLE_RESET_THRESHOLD_MS  = 60 * 1000 # 60 seconds of zero input resets continuous streak
$SECURITY_CODE            = "1234567890"

# Runtime State
$global:ContinuousSeconds = 0
$global:IsLocked = $false

# Setup Windows System Tray Icon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Text = "ChronosGuard Screen Monitor (Active)"
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Shield
$notifyIcon.Visible = $true

$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
$menuItemStatus = $contextMenu.Items.Add("ChronosGuard: Monitoring Active (15m limit)")
$menuItemStatus.Enabled = $false
$menuItemSep1 = $contextMenu.Items.Add("-")

$menuItemLockNow = $contextMenu.Items.Add("Trigger Forced 2h Lock Now")
$menuItemLockNow.add_Click({
    Show-ChronosLockScreen
})

$menuItemStartup = $contextMenu.Items.Add("Windows Startup: Enabled")
$menuItemStartup.Checked = $true
$menuItemStartup.Enabled = $false

$menuItemExit = $contextMenu.Items.Add("Exit Sentinel")
$menuItemExit.add_Click({
    $notifyIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
})

$notifyIcon.ContextMenuStrip = $contextMenu

# Function: Display Mandatory 2-Hour Lock Screen Overlay
function Show-ChronosLockScreen {
    $global:IsLocked = $true
    $notifyIcon.ShowBalloonTip(5000, "ChronosGuard Alert", "Continuous 15m screen limit reached! Taking 2-hour break.", [System.Windows.Forms.ToolTipIcon]::Warning)

    # WPF Fullscreen Modal
    [xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ChronosGuard Lock"
        WindowStyle="None"
        WindowState="Maximized"
        Topmost="True"
        Background="#080C14"
        ShowInTaskbar="False"
        ResizeMode="NoResize">
    <Grid Margin="40">
        <Border Background="#0F172A" CornerRadius="16" BorderBrush="#334155" BorderThickness="1.5" MaxWidth="800" MaxHeight="680" VerticalAlignment="Center" HorizontalAlignment="Center" Padding="40">
            <StackPanel HorizontalAlignment="Center">
                <TextBlock Text="MANDATORY SCREEN BREAK IN EFFECT" FontSize="14" FontWeight="Bold" Foreground="#38BDF8" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                <TextBlock Text="Take a Break for 2 Hours" FontSize="32" FontWeight="ExtraBold" Foreground="White" HorizontalAlignment="Center" Margin="0,0,0,14"/>
                <TextBlock Text="You have been using the computer continuously for 15 minutes. Step away from your display to prevent eye strain and fatigue." TextWrapping="Wrap" FontSize="14" Foreground="#94A3B8" TextAlignment="Center" MaxWidth="620" Margin="0,0,0,24"/>
                
                <!-- Countdown Display -->
                <Border Background="#030712" CornerRadius="12" Padding="20,16" Margin="0,0,0,24">
                    <StackPanel HorizontalAlignment="Center">
                        <TextBlock Text="REMAINING FORCED BREAK" FontSize="12" FontWeight="SemiBold" Foreground="#64748B" HorizontalAlignment="Center"/>
                        <TextBlock x:Name="TimerText" Text="02:00:00" FontSize="44" FontWeight="Bold" FontFamily="Consolas" Foreground="#F59E0B" HorizontalAlignment="Center" Margin="0,4,0,0"/>
                    </StackPanel>
                </Border>

                <!-- Chart representation note -->
                <Border Background="#1E293B" CornerRadius="8" Padding="14,10" Margin="0,0,0,24">
                    <TextBlock Text="Session Summary: 15 continuous minutes active | Intensity: High | Forced lock triggered." FontSize="13" Foreground="#CBD5E1" HorizontalAlignment="Center"/>
                </Border>

                <!-- Security Passcode Input -->
                <TextBlock Text="Emergency Override (Security Code: 1234567890)" FontSize="13" FontWeight="SemiBold" Foreground="#94A3B8" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                <PasswordBox x:Name="PasscodeInput" FontSize="20" HorizontalAlignment="Center" Width="260" HorizontalContentAlignment="Center" Background="#030712" Foreground="White" BorderBrush="#475569" Padding="8,4" Margin="0,0,0,10"/>
                <TextBlock x:Name="ErrorLabel" Text="" FontSize="13" FontWeight="SemiBold" Foreground="#EF4444" HorizontalAlignment="Center" Margin="0,0,0,12"/>
                
                <Button x:Name="UnlockButton" Content="Unlock Screen with Code" Width="240" Height="42" Background="#2563EB" Foreground="White" FontWeight="Bold" FontSize="14" Cursor="Hand"/>
            </StackPanel>
        </Border>
    </Grid>
</Window>
"@

    $reader = (New-Object System.Xml.XmlNodeReader $xaml)
    $window = [System.Windows.Markup.XamlReader]::Load($reader)

    $timerText = $window.FindName("TimerText")
    $passcodeInput = $window.FindName("PasscodeInput")
    $errorLabel = $window.FindName("ErrorLabel")
    $unlockButton = $window.FindName("UnlockButton")

    $remainingSeconds = $BREAK_DURATION_SECONDS

    # Timer inside WPF window
    $breakTimer = New-Object System.Windows.Threading.DispatcherTimer
    $breakTimer.Interval = [TimeSpan]::FromSeconds(1)
    $breakTimer.Add_Tick({
        $script:remainingSeconds--
        $span = [TimeSpan]::FromSeconds([Math]::Max(0, $script:remainingSeconds))
        $timerText.Text = "{0:D2}:{1:D2}:{2:D2}" -f [int]$span.Hours, [int]$span.Minutes, [int]$span.Seconds

        if ($script:remainingSeconds -le 0) {
            $breakTimer.Stop()
            $global:IsLocked = $false
            $global:ContinuousSeconds = 0
            $window.Close()
        }
    })
    $breakTimer.Start()

    $unlockAction = {
        if ($passcodeInput.Password -eq $SECURITY_CODE) {
            $breakTimer.Stop()
            $global:IsLocked = $false
            $global:ContinuousSeconds = 0
            $window.Close()
        } else {
            $errorLabel.Text = "Incorrect security passcode! Enter 1234567890."
            $passcodeInput.Clear()
        }
    }

    $unlockButton.Add_Click($unlockAction)
    $window.Add_KeyDown({
        if ($_.Key -eq 'Return') {
            & $unlockAction
        }
    })

    $window.ShowDialog() | Out-Null
}

# Main Background Monitoring Loop (Runs Silently in System Tray)
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000 # Tick every 1 second
$timer.add_Tick({
    if ($global:IsLocked) { return }

    $idleMs = [Win32]::GetIdleTimeMs()
    if ($idleMs -gt $IDLE_RESET_THRESHOLD_MS) {
        # User has been idle for more than 60 seconds -> reset continuous streak
        $global:ContinuousSeconds = 0
        $notifyIcon.Text = "ChronosGuard: Idle (Streak reset)"
    } else {
        $global:ContinuousSeconds++
        $mins = [Math]::Floor($global:ContinuousSeconds / 60)
        $secs = $global:ContinuousSeconds % 60
        $notifyIcon.Text = "ChronosGuard: $mins m $secs s continuous (Max: 15m)"

        if ($global:ContinuousSeconds -ge $CONTINUOUS_LIMIT_SECONDS) {
            Show-ChronosLockScreen
        }
    }
})
$timer.Start()

# Keep PowerShell message pump running for system tray
[System.Windows.Forms.Application]::Run()
`;

export const BATCH_INSTALLER = `@echo off
:: ==============================================================================
:: ChronosGuard Windows 1-Click Installer
:: Installs silent background agent and enables automatic login startup
:: ==============================================================================
title ChronosGuard Windows Setup
echo ======================================================
echo Installing ChronosGuard Screen Time Sentinel for Windows
echo ======================================================

set "INSTALL_DIR=%LOCALAPPDATA%\\ChronosGuard"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [1/3] Copying Sentinel background daemon script...
copy /Y "ChronosGuard_Daemon.ps1" "%INSTALL_DIR%\\ChronosGuard_Daemon.ps1" >nul

echo [2/3] Configuring Windows Registry to launch automatically on login...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "ChronosGuard" /t REG_SZ /d "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \\"%INSTALL_DIR%\\ChronosGuard_Daemon.ps1\\"" /f >nul

echo [3/3] Launching silent system tray sentinel process...
start "" powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%INSTALL_DIR%\\ChronosGuard_Daemon.ps1"

echo.
echo ======================================================
echo Installation Successful!
echo - ChronosGuard is now monitoring silently in the System Tray.
echo - Continuous limit: 15 minutes.
echo - Forced break duration: 2 hours.
echo - Emergency unlock passcode: 1234567890.
echo - Starts automatically upon Windows login.
echo ======================================================
pause
`;

export const BATCH_UNINSTALLER = `@echo off
title Uninstall ChronosGuard
echo Uninstalling ChronosGuard...

:: Stop running PowerShell background instances
powershell.exe -Command "Get-Process powershell | Where-Object { $_.MainWindowTitle -eq '' } | Stop-Process -ErrorAction SilentlyContinue"

:: Remove Windows Startup entry
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "ChronosGuard" /f >nul 2>&1

:: Remove files
rmdir /S /Q "%LOCALAPPDATA%\\ChronosGuard" >nul 2>&1

echo ChronosGuard removed from startup and local files cleaned.
pause
`;

export const ELECTRON_MAIN_JS = `// Electron Desktop Implementation for ChronosGuard
const { app, BrowserWindow, Tray, Menu, powerMonitor, ipcMain, screen } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

let tray = null;
let dashboardWindow = null;
let lockWindow = null;
let continuousSeconds = 0;
let isLocked = false;

const CONTINUOUS_LIMIT = 15 * 60; // 15 mins
const BREAK_DURATION = 2 * 3600;  // 2 hours
const SECURITY_CODE = "1234567890";

const autoLauncher = new AutoLaunch({
  name: 'ChronosGuard',
  path: app.getPath('exe'),
});
autoLauncher.enable();

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'ChronosGuard: Active (15m limit)', enabled: false },
    { type: 'separator' },
    { label: 'Open Dashboard', click: openDashboard },
    { label: 'Trigger 2h Lock Screen Now', click: triggerLockScreen },
    { label: 'Auto-Start on Login: Enabled', enabled: false },
    { type: 'separator' },
    { label: 'Exit ChronosGuard', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('ChronosGuard Screen Time Sentinel');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', openDashboard);
}

function triggerLockScreen() {
  if (isLocked) return;
  isLocked = true;
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  lockWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    kiosk: true,
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  lockWindow.loadFile(path.join(__dirname, 'lockscreen.html'));
  lockWindow.setAlwaysOnTop(true, 'screen-saver');
}

ipcMain.on('verify-unlock-code', (event, code) => {
  if (code === SECURITY_CODE) {
    isLocked = false;
    continuousSeconds = 0;
    if (lockWindow) lockWindow.close();
    event.reply('unlock-success');
  } else {
    event.reply('unlock-failed');
  }
});

app.whenReady().then(() => {
  createTray();
  setInterval(() => {
    if (isLocked) return;
    const idleSeconds = powerMonitor.getSystemIdleTime();
    if (idleSeconds > 60) {
      continuousSeconds = 0;
    } else {
      continuousSeconds++;
      if (continuousSeconds >= CONTINUOUS_LIMIT) {
        triggerLockScreen();
      }
    }
  }, 1000);
});
`;
