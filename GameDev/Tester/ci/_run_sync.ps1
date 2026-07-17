# ci/_run_sync.ps1
# PowerShell runner for sync_mirror.psi.
# Usage (from project root): powershell -ExecutionPolicy Bypass -NoProfile -File "ci\_run_sync.ps1"
#
# This script is self-contained. It mirrors the logic in sync_mirror.psi
# using absolute paths derived from $PSScriptRoot, which is reliable when
# invoked via -File.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$ProjectName = Split-Path $ProjectRoot -Leaf
$ProjectParent = Split-Path $ProjectRoot -Parent
$MirrorRoot  = Join-Path $ProjectParent ($ProjectName + "_mirror")

Write-Host "=== sync_mirror ===" -ForegroundColor Cyan
Write-Host "Source : $ProjectRoot"
Write-Host "Mirror : $MirrorRoot"

if (-not (Test-Path $MirrorRoot)) {
    Write-Error "Mirror directory not found: $MirrorRoot"
    exit 1
}

$fileList = (git -C $ProjectRoot ls-files) -split "`n" | Where-Object {
    $path = $_.Trim().Replace("\", "/")
    $path -ne "" -and
    -not $path.StartsWith("Tester_mirror/") -and
    -not $path.StartsWith("Library/") -and
    -not $path.StartsWith("Temp/") -and
    -not $path.StartsWith("Logs/") -and
    -not $path.StartsWith("UserSettings/")
}
Write-Host "Files tracked by git: $($fileList.Count)"

$copied  = 0
$skipped = 0
$errors  = 0

foreach ($relPath in $fileList) {
    $relPath = $relPath.Trim().Replace("/", "\")
    $src     = Join-Path $ProjectRoot $relPath
    $dst     = Join-Path $MirrorRoot  $relPath

    if (-not (Test-Path $src -PathType Leaf)) {
        Write-Warning "MISSING: $relPath"
        $skipped++
        continue
    }

    try {
        $dstDir = Split-Path $dst -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item -Path $src -Destination $dst -Force
        $copied++
    }
    catch {
        Write-Warning "ERROR: $relPath -- $_"
        $errors++
    }
}

Write-Host ""
Write-Host "Copied : $copied   Skipped: $skipped   Errors: $errors"

if ($errors -gt 0) {
    Write-Host "Mirror sync completed WITH ERRORS." -ForegroundColor Red
    exit 1
}

Write-Host "Mirror sync complete. OK" -ForegroundColor Green
exit 0
