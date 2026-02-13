Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

& "$PSScriptRoot\agent-checkpoint-prune.ps1" @args
