# PowerShell script to extract subtitle text from SRT file
# Usage: .\extract-subtitle-text.ps1 -InputFile "path\to\input.srt"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile
)

# Validate input file exists
if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

# Get file info for output naming
$fileInfo = Get-Item $InputFile
$outputFile = Join-Path $fileInfo.DirectoryName "$($fileInfo.BaseName)_original.txt"

# Read SRT file with UTF-8 encoding
$content = Get-Content $InputFile -Encoding UTF8

$subtitleTexts = @()
$currentText = ""
$isTextLine = $false

foreach ($line in $content) {
    $line = $line.Trim()
    
    # Skip sequence number lines (pure number)
    if ($line -match '^\d+$') {
        # Save previous text if exists
        if ($currentText -ne "") {
            $subtitleTexts += $currentText.Trim()
            $currentText = ""
        }
        $isTextLine = $false
        continue
    }
    
    # Skip timestamp lines
    if ($line -match '\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}') {
        # Save previous text if exists
        if ($currentText -ne "") {
            $subtitleTexts += $currentText.Trim()
            $currentText = ""
        }
        $isTextLine = $true
        continue
    }
    
    # This is subtitle text (non-empty, and not a separator)
    if ($isTextLine -and -not [string]::IsNullOrWhiteSpace($line)) {
        if ($currentText -eq "") {
            $currentText = $line
        } else {
            $currentText += " " + $line
        }
    }
}

# Add the last text if exists
if ($currentText -ne "") {
    $subtitleTexts += $currentText.Trim()
}

# Write to output file with UTF-8 encoding (no BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($outputFile, $subtitleTexts, $utf8NoBom)

Write-Output "Extracted $($subtitleTexts.Count) subtitle texts to: $outputFile"
