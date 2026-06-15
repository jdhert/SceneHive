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
    [string]$HandoffFile = "HANDOFF.md",
    [string]$AgentsFile = ""
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

$targetFile = if (-not [string]::IsNullOrWhiteSpace($AgentsFile)) { $AgentsFile } else { $HandoffFile }

if (-not (Test-Path -Path $targetFile)) {
    $initialContent = @'
# HANDOFF.md

이 문서는 SceneHive 작업 세션의 최신/누적 Handoff Snapshot을 보관한다.
에이전트 운영 규칙과 프로젝트 고정 컨텍스트는 `AGENTS.md`를 기준으로 하고, 실제 이어받기 시작점은 이 파일의 가장 최신 Snapshot을 기준으로 한다.

## 운영 규칙

- 최신 Snapshot은 항상 위쪽에 추가한다.
- 오래된 Snapshot은 `checkpoint-prune -Keep 30` 또는 `./scripts/checkpoint-prune.ps1 -Keep 30`으로 `AGENTS_ARCHIVE.md`에 보관한다.
- 작업 종료 또는 긴 작업 전에는 `checkpoint`/`ckp`를 실행해 현재 상태를 남긴다.

## Handoff Snapshot Log (Auto)
<!-- HANDOFF_LOG_START -->
<!-- HANDOFF_LOG_END -->
'@
    Write-Utf8File -Path $targetFile -Content $initialContent
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

$content = Get-Content -Path $targetFile -Raw -Encoding UTF8
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
    Write-Utf8File -Path $targetFile -Content $updated
}
else {
    $logBlock = @"
## Handoff Snapshot Log (Auto)
<!-- HANDOFF_LOG_START -->
$snapshot
<!-- HANDOFF_LOG_END -->
"@

    $updated = $content.TrimEnd() + "`r`n`r`n" + $logBlock.TrimEnd() + "`r`n"
    Write-Utf8File -Path $targetFile -Content $updated
}

Write-Host "Checkpoint updated in $targetFile"
Write-Host "Timestamp: $timestamp"
Write-Host "Branch: $branch"
