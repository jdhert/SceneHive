Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function checkpoint {
    & "$PSScriptRoot\checkpoint.ps1" @args
}

function checkpoint-prune {
    & "$PSScriptRoot\checkpoint-prune.ps1" @args
}

Set-Alias ckp checkpoint -Scope Global
Set-Alias ckpr checkpoint-prune -Scope Global

Write-Host "Loaded aliases: checkpoint, checkpoint-prune, ckp, ckpr"
