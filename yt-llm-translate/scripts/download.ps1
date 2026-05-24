param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Url,

    [string]$Proxy,

    [switch]$NoProxy,

    [string]$CookiesBrowser = "firefox",

    [string]$OutputDir = "."
)

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if ((-not $Proxy) -and (-not $NoProxy)) {
    $configPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($config.'yt-download-proxy') {
            $Proxy = $config.'yt-download-proxy'
        }
    }
}

# ===== Download phase =====
$proxyArgs = @()
if (-not $NoProxy) {
    $proxyArgs = @("--proxy", $Proxy)
}

Write-Output "========================================"
Write-Output "  YouTube Download & Subtitle Fix"
Write-Output "========================================"
Write-Output "URL: $Url"

$dlpArgs = @(
    "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]"
    "--embed-metadata"
    "--merge-output-format", "mp4"
    "--write-auto-subs"
    "--sub-langs", "en-orig,ja-orig"
    "--sub-format", "srt"
    "--cookies-from-browser", $CookiesBrowser
    "-o", "%(title)s.mp4"
) + $proxyArgs + @(
    "--js-runtimes", "node"
    $Url
)

$existingFiles = @{}
Get-ChildItem -Path $OutputDir -File | ForEach-Object { $existingFiles[$_.FullName] = $true }

Write-Output ""
Write-Output "--- Downloading ---"
& yt-dlp @dlpArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "yt-dlp failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# ===== Repair phase =====
Write-Output ""
Write-Output "--- Repairing SRT subtitle overlaps ---"

$srtFiles = Get-ChildItem -Path $OutputDir -Filter "*.srt" -File | Where-Object { -not $existingFiles.ContainsKey($_.FullName) }

if ($srtFiles.Count -eq 0) {
    Write-Output "No SRT files found to repair."
    exit 0
}

foreach ($srt in $srtFiles) {
    $outPath = Join-Path $OutputDir ($srt.Name -replace '-orig', '')

    Write-Output "  Processing: $($srt.Name) -> $(Split-Path $outPath -Leaf)"

    $lines = [System.IO.File]::ReadAllLines($srt.FullName, $Utf8NoBom)
    $subtitles = @()
    $currentBlock = @()

    foreach ($line in $lines) {
        if ($line.Trim() -eq '') {
            if ($currentBlock.Count -ge 3) {
                $index = $currentBlock[0].Trim()
                $timeLine = $currentBlock[1]
                $timeMatch = $timeLine -match '(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})'
                if ($timeMatch) {
                    $subtitles += [PSCustomObject]@{
                        Index = $index
                        StartTime = $matches[1]
                        EndTime = $matches[2]
                        Text = ($currentBlock[2..($currentBlock.Count-1)] -join "`n")
                    }
                }
            }
            $currentBlock = @()
        } else {
            $currentBlock += $line
        }
    }

    if ($currentBlock.Count -ge 3) {
        $index = $currentBlock[0].Trim()
        $timeLine = $currentBlock[1]
        $timeMatch = $timeLine -match '(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})'
        if ($timeMatch) {
            $subtitles += [PSCustomObject]@{
                Index = $index
                StartTime = $matches[1]
                EndTime = $matches[2]
                Text = ($currentBlock[2..($currentBlock.Count-1)] -join "`n")
            }
        }
    }

    for ($i = 0; $i -lt $subtitles.Count - 1; $i++) {
        $subtitles[$i].EndTime = $subtitles[$i + 1].StartTime
    }

    $outputLines = @()
    for ($i = 0; $i -lt $subtitles.Count; $i++) {
        $outputLines += $subtitles[$i].Index
        $outputLines += "$($subtitles[$i].StartTime) --> $($subtitles[$i].EndTime)"
        $outputLines += $subtitles[$i].Text.Split("`n")
        if ($i -lt $subtitles.Count - 1) {
            $outputLines += ''
        }
    }

    [System.IO.File]::WriteAllLines($outPath, $outputLines, $Utf8NoBom)

    Remove-Item $srt.FullName
}

# ===== Sanitize phase: normalize Unicode punctuation in filenames =====
Write-Output ""
Write-Output "--- Sanitizing filenames ---"

function Sanitize-Filename($name) {
    $result = $name -replace [char]0x2018, "'"
    $result = $result -replace [char]0x2019, "'"
    $result = $result -replace [char]0x201C, '"'
    $result = $result -replace [char]0x201D, '"'
    $result = $result -replace [char]0x2013, '-'
    $result = $result -replace [char]0x2014, '--'
    $result = $result -replace [char]0x2026, '...'
    $result = $result -replace [char]0xFF1F, '?'
    $result = $result -replace [char]0xFF01, '!'
    $result = $result -replace [char]0x201A, ','
    $result = $result -replace [char]0x201E, '"'
    $result = $result -replace [char]0x2022, '-'
    $result = $result -replace [char]0x2027, '-'
    $result = $result -replace [char]0x00A0, ' '
    $result = $result -replace [char]0x29F8, '-'
    return $result
}

$newFiles = Get-ChildItem -Path $OutputDir -File | Where-Object { -not $existingFiles.ContainsKey($_.FullName) }
foreach ($file in $newFiles) {
    $newName = Sanitize-Filename $file.Name
    if ($newName -ne $file.Name) {
        $newPath = Join-Path $OutputDir $newName
        if (Test-Path $newPath) {
            Write-Output "  WARNING: Cannot rename $($file.Name) -> $newName, target already exists"
        } else {
            Rename-Item -LiteralPath $file.FullName -NewName $newName
            Write-Output "  Renamed: $($file.Name) -> $newName"
        }
    }
}

Write-Output ""
Write-Output "========================================"
Write-Output "  Complete! Processed files:"
$srtFiles | ForEach-Object {
    $sanitized = Sanitize-Filename ($_.Name -replace '-orig', '')
    Write-Output "    $sanitized"
}
Write-Output "========================================"