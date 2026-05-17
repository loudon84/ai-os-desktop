!pragma warning disable 6001
!pragma warning disable 6010

!include LogicLib.nsh
!include WinMessages.nsh
!include "nsis\Include\AddToPathSafe.nsh"

Var ExistingInstallDir
Var RuntimeRoot
Var BinDir
Var LegacyInstallDir
Var PreviousAppVersion

!macro preInit
  SetRegView 64

  ; 1. HKCU SMC Copilot
  ReadRegStr $ExistingInstallDir HKCU "Software\SMC\Copilot" "InstallLocation"

  ; 2. HKLM SMC Copilot
  ${If} $ExistingInstallDir == ""
    ReadRegStr $ExistingInstallDir HKLM "Software\SMC\Copilot" "InstallLocation"
  ${EndIf}

  ; 3. Legacy CopilotSMC
  ${If} $ExistingInstallDir == ""
    ReadRegStr $ExistingInstallDir HKCU "Software\SMC\CopilotSMC" "InstallLocation"
  ${EndIf}

  ; 4. Legacy HermesDesktop
  ${If} $ExistingInstallDir == ""
    ReadRegStr $LegacyInstallDir HKCU "Software\SMC\HermesDesktop" "InstallLocation"
    ${If} $LegacyInstallDir != ""
      StrCpy $ExistingInstallDir $LegacyInstallDir
    ${EndIf}
  ${EndIf}

  ; 5. Legacy com.nousresearch.hermes uninstall entry
  ${If} $ExistingInstallDir == ""
    ReadRegStr $LegacyInstallDir HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.nousresearch.hermes" "InstallLocation"
    ${If} $LegacyInstallDir != ""
      StrCpy $ExistingInstallDir $LegacyInstallDir
    ${EndIf}
  ${EndIf}

  ; 6. Default first-install directory
  ${If} $ExistingInstallDir == ""
    StrCpy $ExistingInstallDir "$LOCALAPPDATA\Programs\SMC Copilot"
  ${EndIf}

  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$ExistingInstallDir"
  SetRegView 32
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$ExistingInstallDir"
!macroend

!macro customInstall
  DetailPrint "Preparing SMC Copilot upgrade-safe directories..."

  StrCpy $RuntimeRoot "$INSTDIR\runtime"
  StrCpy $BinDir "$INSTDIR\bin"

  ; Read previous version for upgrade tracking
  ReadRegStr $PreviousAppVersion HKCU "Software\SMC\Copilot" "AppVersion"

  CreateDirectory "$INSTDIR\bin"
  CreateDirectory "$INSTDIR\runtime"
  CreateDirectory "$INSTDIR\runtime\hermes-agent"
  CreateDirectory "$INSTDIR\runtime\logs"
  CreateDirectory "$INSTDIR\runtime\cache"
  CreateDirectory "$INSTDIR\runtime\downloads"

  ; Desktop launcher shim
  FileOpen $0 "$INSTDIR\bin\smc-copilot.cmd" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" %*$\r$\n'
  FileClose $0

  ; Legacy shim name (compat)
  FileOpen $0 "$INSTDIR\bin\hermes-desktop.cmd" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" %*$\r$\n'
  FileClose $0

  ; Hermes CLI placeholder (refreshed by Electron ensureShims after agent install)
  FileOpen $1 "$INSTDIR\bin\hermes.cmd" w
  FileWrite $1 "@echo off$\r$\n"
  FileWrite $1 "set HERMES_HOME=%USERPROFILE%\.hermes$\r$\n"
  FileWrite $1 'set SMC_COPILOT_HOME=%~dp0..$\r$\n'
  FileWrite $1 '"%SMC_COPILOT_HOME%\runtime\hermes-agent\venv\Scripts\hermes.exe" %*$\r$\n'
  FileClose $1

  ; desktop-runtime.json (hybrid identity)
  FileOpen $2 "$INSTDIR\runtime\desktop-runtime.json" w
  FileWrite $2 '{$\r$\n'
  FileWrite $2 '  "productName": "SMC Copilot",$\r$\n'
  FileWrite $2 '  "appId": "com.smc.smc-ai-copilot",$\r$\n'
  FileWrite $2 '  "executableName": "smc-ai-copilot",$\r$\n'
  FileWrite $2 '  "installDir": "$INSTDIR",$\r$\n'
  FileWrite $2 '  "runtimeRoot": "$INSTDIR\\runtime",$\r$\n'
  FileWrite $2 '  "binDir": "$INSTDIR\\bin",$\r$\n'
  FileWrite $2 '  "agentDir": "$INSTDIR\\runtime\\hermes-agent",$\r$\n'
  FileWrite $2 '  "legacyAppIds": ["com.nousresearch.hermes"]$\r$\n'
  FileWrite $2 '}$\r$\n'
  FileClose $2

  WriteRegExpandStr HKCU "Software\SMC\Copilot" "InstallLocation" "$INSTDIR"
  WriteRegExpandStr HKCU "Software\SMC\Copilot" "RuntimeRoot" "$INSTDIR\runtime"
  WriteRegExpandStr HKCU "Software\SMC\Copilot" "BinDir" "$INSTDIR\bin"
  WriteRegStr HKCU "Software\SMC\Copilot" "AppVersion" "${VERSION}"
  WriteRegStr HKCU "Software\SMC\Copilot" "InstallMode" "per-user"
  ${If} $PreviousAppVersion != ""
    WriteRegStr HKCU "Software\SMC\Copilot" "PreviousVersion" "$PreviousAppVersion"
  ${EndIf}
  WriteRegStr HKCU "Software\SMC\Copilot" "LastUpdatedAt" "${__DATE__} ${__TIME__}"

  !insertmacro AddToPathSafe "$INSTDIR\bin"

  ; Remove legacy shortcuts
  Delete "$DESKTOP\Hermes Agent.lnk"
  Delete "$DESKTOP\Hermes Desktop.lnk"
  Delete "$SMPROGRAMS\Hermes Agent.lnk"
  Delete "$SMPROGRAMS\Hermes Desktop.lnk"

  System::Call 'user32::SendMessageTimeout(i 0xffff, i ${WM_SETTINGCHANGE}, i 0, t "Environment", i 0, i 5000, *i .r0)'
!macroend

!macro customUnInstall
  ReadRegStr $RuntimeRoot HKCU "Software\SMC\Copilot" "RuntimeRoot"
  ReadRegStr $BinDir HKCU "Software\SMC\Copilot" "BinDir"
  DetailPrint "Removing SMC Copilot from user PATH ($BinDir)..."

  !insertmacro RemoveFromPathSafe "$INSTDIR\bin"

  DeleteRegKey HKCU "Software\SMC\Copilot"
  DeleteRegKey HKCU "Software\SMC\CopilotSMC"

  System::Call 'user32::SendMessageTimeout(i 0xffff, i ${WM_SETTINGCHANGE}, i 0, t "Environment", i 0, i 5000, *i .r0)'
!macroend
