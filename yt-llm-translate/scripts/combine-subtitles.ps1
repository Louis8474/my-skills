# PowerShell script to combine original SRT with translated text
# Usage: .\combine-subtitles.ps1 -InputFile "path\to\input.srt" -OriginalText "path\to\原文.txt" -ChineseText "path\to\中文.txt"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$true)]
    [string]$OriginalText,
    
    [Parameter(Mandatory=$true)]
    [string]$ChineseText
)

# Validate input files exist
if (-not (Test-Path $InputFile)) {
    Write-Error "Input SRT file not found: $InputFile"
    exit 1
}
if (-not (Test-Path $OriginalText)) {
    Write-Error "Original text file not found: $OriginalText"
    exit 1
}
if (-not (Test-Path $ChineseText)) {
    Write-Error "Chinese text file not found: $ChineseText"
    exit 1
}

# Get file info for output naming
$fileInfo = Get-Item $InputFile
$outputFile = Join-Path $fileInfo.DirectoryName "Bilingual_$($fileInfo.Name)"

# Read all files
$srtContent = Get-Content $InputFile -Encoding UTF8
$originalTexts = Get-Content $OriginalText -Encoding UTF8
$chineseTexts = Get-Content $ChineseText -Encoding UTF8

# Validate text count matches - must be exact for correct subtitle alignment
if ($originalTexts.Count -ne $chineseTexts.Count) {
    Write-Error "FATAL: Text count mismatch - Original($($originalTexts.Count)) vs Chinese($($chineseTexts.Count)). Fix the Chinese text file and re-run."
    exit 1
}

# Process SRT and combine
$output = @()
$textIndex = 0
$currentBlock = @()
$isTextLine = $false

foreach ($line in $srtContent) {
    $trimmedLine = $line.Trim()
    
    # Empty line = end of block
    if ([string]::IsNullOrWhiteSpace($trimmedLine)) {
        if ($currentBlock.Count -gt 0) {
            # Add original block lines
            $output += $currentBlock
            
            # Add Chinese translation if available
            if ($textIndex -lt $chineseTexts.Count) {
                $output += $chineseTexts[$textIndex]
            }
            
            # Add empty line separator
            $output += ""
            
            $currentBlock = @()
            $isTextLine = $false
            $textIndex++
        }
        continue
    }
    
    # Skip sequence number
    if ($trimmedLine -match '^\d+$') {
        $currentBlock += $trimmedLine
        $isTextLine = $false
        continue
    }
    
    # Timestamp line
    if ($trimmedLine -match '\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}') {
        $currentBlock += $trimmedLine
        $isTextLine = $true
        continue
    }
    
    # Subtitle text line
    if ($isTextLine) {
        $currentBlock += $trimmedLine
    }
}

# Handle last block if no trailing empty line
if ($currentBlock.Count -gt 0) {
    $output += $currentBlock
    if ($textIndex -lt $chineseTexts.Count) {
        $output += $chineseTexts[$textIndex]
    }
    $output += ""
    $textIndex++
}

# Write output file with UTF-8 encoding (no BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($outputFile, $output, $utf8NoBom)

Write-Output "Created bilingual subtitle file: $outputFile"
Write-Output "Total subtitle blocks processed: $textIndex"
