param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$false)]
    [string]$WorkspaceDir = ""
)

$configPath = Join-Path $PSScriptRoot "config.json"
$debug = $false
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $debug = $config.debug -eq $true
}

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

$fileInfo = Get-Item $InputFile
$originalName = $fileInfo.Name
$baseName = $fileInfo.BaseName
$extension = $fileInfo.Extension
$parentDir = $fileInfo.DirectoryName

$bilingualFile = Join-Path $parentDir "Bilingual_$originalName"
$backupFile = Join-Path $parentDir "$baseName-src$extension"

if (-not (Test-Path $bilingualFile)) {
    Write-Error "Bilingual file not found: $bilingualFile"
    exit 1
}

$bilingualInfo = Get-Item $bilingualFile
if ($bilingualInfo.Length -eq 0) {
    Write-Error "Bilingual file is empty: $bilingualFile"
    exit 1
}

$content = Get-Content $bilingualFile -Encoding UTF8
$blockCount = ($content | Where-Object { $_ -match '^\d+$' }).Count

Rename-Item $InputFile -NewName "$baseName-src$extension" -Force
Write-Output "Renamed original: $originalName -> $baseName-src$extension"

Rename-Item $bilingualFile -NewName $originalName
Write-Output "Replaced with bilingual: $originalName"

if (-not $debug) {
    if ($WorkspaceDir -and (Test-Path $WorkspaceDir)) {
        Remove-Item $WorkspaceDir -Recurse -Force
        Write-Output "Cleaned up workspace: $WorkspaceDir"
    }
    @("srt_punctuator.log", "$baseName-bak.srt", "$baseName-src$extension") | ForEach-Object {
        $path = Join-Path $parentDir $_
        if (Test-Path $path) {
            Remove-Item $path -Force
            Write-Output "Cleaned up: $path"
        }
    }
}

$newFile = Get-Item (Join-Path $parentDir $originalName)

Write-Output "========================================"
Write-Output "File replacement complete!"
Write-Output "Original backup: $baseName-src$extension"
Write-Output "Current file:    $originalName"
Write-Output "Size: $($newFile.Length) bytes"
Write-Output "Subtitle blocks: $blockCount"
Write-Output "========================================"
