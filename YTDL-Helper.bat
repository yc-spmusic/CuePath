<# :
@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"
set "BATCH_FILE=%~f0"
set "BATCH_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Command -ScriptBlock ([scriptblock]::Create(((Get-Content -LiteralPath $env:BATCH_FILE -Raw -Encoding UTF8) -replace '(?s)^.*?<# :.*?\n#>','')))"
pause
goto :EOF
#>

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$BatDir = $env:BATCH_DIR

function Show-Disclaimer {
    Write-Host "`n==========================================================================" -ForegroundColor Cyan
    Write-Host "  免責聲明：" -ForegroundColor Yellow
    Write-Host "  此功能僅用於學術用途研究與技術測試使用。" -ForegroundColor Yellow
    Write-Host "  嚴禁任何商業利用，或任何違反 YouTube 服務政策之行為。" -ForegroundColor Yellow
    Write-Host "  測試完畢請務必於 24 小時內將下載的檔案刪除。" -ForegroundColor Yellow
    Write-Host "==========================================================================`n" -ForegroundColor Cyan
}

function Check-Command($cmd) {
    return Get-Command $cmd -ErrorAction SilentlyContinue
}

function Install-Dependencies {
    Show-Disclaimer
    Write-Host "開始檢查與安裝依賴組件 (yt-dlp, ffmpeg)...`n" -ForegroundColor Cyan

    if (-not (Check-Command "winget")) {
        Write-Host "[!] 找不到 winget。請前往 Microsoft Store 安裝「應用程式安裝程式」(App Installer)。" -ForegroundColor Red
        return
    }

    if (Check-Command "yt-dlp") {
        Write-Host "[v] yt-dlp 已安裝。" -ForegroundColor Green
    } else {
        Write-Host "[ ] 正在安裝 yt-dlp..." -ForegroundColor Yellow
        try { winget install yt-dlp.yt-dlp } catch { Write-Host "[!] 安裝 yt-dlp 失敗。" -ForegroundColor Red }
    }

    if (Check-Command "ffmpeg") {
        Write-Host "[v] ffmpeg 已安裝。" -ForegroundColor Green
    } else {
        Write-Host "[ ] 正在安裝 ffmpeg (音檔轉檔必備)..." -ForegroundColor Yellow
        try { winget install Gyan.FFmpeg } catch { Write-Host "[!] 安裝 ffmpeg 失敗。" -ForegroundColor Red }
    }
    
    Write-Host "`n依賴組件檢查與安裝結束。" -ForegroundColor Cyan
    Write-Host "如果您剛剛才安裝完畢，可能需要重新啟動此工具才能生效。" -ForegroundColor Yellow
}

function Download-YouTube {
    $ytDlp = Check-Command "yt-dlp"
    if (-not $ytDlp) {
        Write-Host "[!] 尚未安裝 yt-dlp！" -ForegroundColor Red
        Write-Host "請先選擇「1. 安裝/檢查依賴組件」進行安裝。" -ForegroundColor Yellow
        return
    }

    Show-Disclaimer
    
    $Downloads = Join-Path $BatDir "downloads"
    if (-not (Test-Path -LiteralPath $Downloads)) {
        New-Item -ItemType Directory -Path $Downloads | Out-Null
    }
    
    $Url = Read-Host "請貼上 YouTube 網址 (URL)"
    if ([string]::IsNullOrWhiteSpace($Url)) {
        Write-Host "未提供網址，取消下載。" -ForegroundColor Yellow
        return
    }
    
    $Manifest = Join-Path $Downloads "downloads-manifest.json"
    $outputTemplate = "%(title).180B [%(id)s].%(ext)s"
    
    Write-Host "`n準備下載音檔至: $Downloads" -ForegroundColor Cyan
    & $ytDlp.Source --no-playlist --extract-audio --audio-format mp3 --audio-quality 0 --windows-filenames --paths "$Downloads" --output "$outputTemplate" "$Url"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n下載失敗！請確認網址是否正確或網路狀態。" -ForegroundColor Red
        return
    }
    
    # 更新 downloads-manifest.json 供主程式讀取
    $files = Get-ChildItem -LiteralPath $Downloads -File |
        Where-Object { $_.Name -ne "downloads-manifest.json" -and $_.Name -ne ".gitkeep" } |
        Sort-Object Name |
        ForEach-Object {
            [PSCustomObject]@{
                name = $_.Name
                size = $_.Length
                lastWriteTime = $_.LastWriteTimeUtc.ToString("o")
            }
        }
        
    $totalBytes = @($files | Measure-Object -Property size -Sum).Sum
    if ($null -eq $totalBytes) { $totalBytes = 0 }
    
    $summary = [PSCustomObject]@{
        generatedAt = (Get-Date).ToUniversalTime().ToString("o")
        folder = "downloads"
        count = @($files).Count
        totalBytes = [int64]$totalBytes
        files = $files
    }
    
    $summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Manifest -Encoding UTF8
    
    Write-Host "`n下載完成！" -ForegroundColor Green
    Write-Host "檔案總數: $($summary.count)"
    Write-Host "總位元組: $($summary.totalBytes)"
    Write-Host "您可以回到主程式匯入音檔，若儲存功能開啟則會自動讀取 Downloads 目錄；或按 Refresh 更新列表。" -ForegroundColor Cyan
}

while ($true) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "  YouTube 音檔下載小工具 v0.1.0" -ForegroundColor White
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  1. 安裝/檢查依賴組件 (yt-dlp, ffmpeg)"
    Write-Host "  2. 從 YouTube 下載音檔"
    Write-Host "  3. 離開"
    Write-Host "==================================================" -ForegroundColor Cyan
    
    $choice = Read-Host "請選擇功能 (輸入 1-3)"
    
    switch ($choice) {
        "1" { Install-Dependencies }
        "2" { Download-YouTube }
        "3" { Write-Host "`n再見！"; exit 0 }
        default { Write-Host "`n無效的選擇，請輸入 1, 2 或 3。" -ForegroundColor Yellow }
    }
}