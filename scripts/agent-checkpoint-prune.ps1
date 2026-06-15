param(
    [int]$Keep = 30,
    [string]$HandoffFile = "HANDOFF.md",
    [string]$AgentsFile = "",
    [string]$ArchiveFile = "AGENTS_ARCHIVE.md",
    [switch]$NoArchive
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $resolvedPath = if (Test-Path -Path $Path) {
        (Resolve-Path -Path $Path).Path
    }
    else {
        Join-Path (Get-Location) $Path
    }

    [System.IO.File]::WriteAllText(
        $resolvedPath,
        $Content.TrimEnd() + "`r`n",
        [System.Text.UTF8Encoding]::new($false)
    )
}

if ($Keep -lt 1) {
    throw "Keep must be >= 1"
}

$targetFile = if (-not [string]::IsNullOrWhiteSpace($AgentsFile)) { $AgentsFile } else { $HandoffFile }

if (-not (Test-Path -Path $targetFile)) {
    throw "Handoff file not found: $targetFile"
}

$content = Get-Content -Path $targetFile -Raw -Encoding UTF8
$pattern = "(?s)(<!-- HANDOFF_LOG_START -->\r?\n)(.*?)(\r?\n<!-- HANDOFF_LOG_END -->)"
$match = [regex]::Match($content, $pattern)

if (-not $match.Success) {
    throw "Handoff log markers not found in $targetFile"
}

$startMarker = $match.Groups[1].Value
$logBody = $match.Groups[2].Value.Trim()
$endMarker = $match.Groups[3].Value

if ([string]::IsNullOrWhiteSpace($logBody)) {
    Write-Host "No log entries found. Nothing to prune."
    exit 0
}

$entryPattern = "(?ms)^## Handoff Snapshot\r?\n.*?(?=^\s*## Handoff Snapshot\r?\n|\z)"
$entryMatches = [regex]::Matches($logBody, $entryPattern)
$entries = @()
foreach ($entry in $entryMatches) {
    $entries += $entry.Value.Trim()
}

if ($entries.Count -le $Keep) {
    Write-Host "No prune needed. Entries: $($entries.Count), Keep: $Keep"
    exit 0
}

$keepEntries = $entries[0..($Keep - 1)]
$prunedEntries = $entries[$Keep..($entries.Count - 1)]

$newLogBody = ($keepEntries -join "`r`n`r`n")
$replacement = $startMarker + $newLogBody + $endMarker

$updated =
    $content.Substring(0, $match.Index) +
    $replacement +
    $content.Substring($match.Index + $match.Length)

Write-Utf8File -Path $targetFile -Content $updated

if (-not $NoArchive -and $prunedEntries.Count -gt 0) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
    if (-not (Test-Path -Path $ArchiveFile)) {
        Write-Utf8File -Path $ArchiveFile -Content "# Handoff Snapshot Archive"
    }

    $archiveBlock = @"
## Archive Batch
- Timestamp: $timestamp
- Source: $targetFile
- Policy: keep latest $Keep snapshots

$($prunedEntries -join "`r`n`r`n")
"@

    Add-Content -Path $ArchiveFile -Value ("`r`n" + $archiveBlock.TrimEnd() + "`r`n") -Encoding UTF8
}

Write-Host "Pruned $($prunedEntries.Count) snapshots. Kept $Keep latest snapshots in $targetFile."
if (-not $NoArchive) {
    Write-Host "Archived pruned snapshots to $ArchiveFile"
}
