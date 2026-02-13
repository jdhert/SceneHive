param(
    [string]$AgentName = "Codex",
    [string]$Goal = "Checkpoint update",
    [string]$ScopeIn = "Current task scope",
    [string]$ScopeOut = "No out-of-scope work",
    [ValidateSet("not started", "in progress", "blocked", "done")]
    [string]$Status = "in progress",
    [string]$PercentComplete = "0%",
    [string]$TestsResult = "Not run",
    [string]$OpenRisks = "None",
    [string]$Blockers = "None",
    [string]$NextAction1 = "Define next task",
    [string]$NextAction2 = "Plan verification",
    [string]$NextAction3 = "Update handoff",
    [string]$ResumeCommand = "git status --short && git branch --show-current",
    [string]$AgentsFile = "AGENTS.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $AgentsFile)) {
    throw "AGENTS file not found: $AgentsFile"
}

$koreaTimeZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("Korea Standard Time")
$koreaNow = [System.TimeZoneInfo]::ConvertTime([DateTimeOffset]::Now, $koreaTimeZone)
$timestamp = $koreaNow.ToString("yyyy-MM-dd HH:mm:ss zzz")

$branch = (git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = "unknown"
}

$statusLines = @(git status --short)
$statusLines = @($statusLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$filesChanged = if ($statusLines.Count -gt 0) { ($statusLines -join ", ") } else { "None" }

$invocationLine = $MyInvocation.Line
if ([string]::IsNullOrWhiteSpace($invocationLine)) {
    $invocationLine = ".\scripts\agent-checkpoint.ps1"
}
$commandsRun = "git branch --show-current, git status --short, $($invocationLine.Trim())"

$snapshot = @"
## Handoff Snapshot
- Timestamp (KST): $timestamp
- Agent Name: $AgentName
- Branch: $branch
- Goal (1 line): $Goal
- Scope (In/Out): In: $ScopeIn / Out: $ScopeOut
- Current Status: $Status
- Percent Complete: $PercentComplete
- Files Changed: $filesChanged
- Commands Run: $commandsRun
- Tests Run + Result: $TestsResult
- Open Risks: $OpenRisks
- Blockers: $Blockers
- Next 3 Actions: 1) $NextAction1, 2) $NextAction2, 3) $NextAction3
- Resume Command: $ResumeCommand
"@

$content = Get-Content -Path $AgentsFile -Raw -Encoding UTF8
$startMarker = "<!-- HANDOFF_LOG_START -->"
$endMarker = "<!-- HANDOFF_LOG_END -->"

if ($content.Contains($startMarker) -and $content.Contains($endMarker)) {
    $pattern = "(?s)(<!-- HANDOFF_LOG_START -->\r?\n)(.*?)(\r?\n<!-- HANDOFF_LOG_END -->)"
    $updated = [regex]::Replace(
        $content,
        $pattern,
        {
            param($match)
            $prefix = $match.Groups[1].Value
            $existing = $match.Groups[2].Value.Trim()
            $suffix = $match.Groups[3].Value
            if ([string]::IsNullOrWhiteSpace($existing)) {
                return $prefix + $snapshot.TrimEnd() + $suffix
            }
            return $prefix + $snapshot.TrimEnd() + "`r`n`r`n" + $existing + $suffix
        },
        1
    )
    Set-Content -Path $AgentsFile -Value $updated -Encoding UTF8
}
else {
    $logBlock = @"
## Handoff Snapshot Log (Auto)
<!-- HANDOFF_LOG_START -->
$snapshot
<!-- HANDOFF_LOG_END -->
"@

    if ($content -match "(?m)^## 10\. 변경 이력") {
        $updated = $content -replace "(?m)^## 10\. 변경 이력", ($logBlock.TrimEnd() + "`r`n`r`n## 10. 변경 이력")
    }
    else {
        $updated = $content.TrimEnd() + "`r`n`r`n" + $logBlock.TrimEnd() + "`r`n"
    }
    Set-Content -Path $AgentsFile -Value $updated -Encoding UTF8
}

Write-Host "Checkpoint updated in $AgentsFile"
Write-Host "Timestamp: $timestamp"
Write-Host "Branch: $branch"
