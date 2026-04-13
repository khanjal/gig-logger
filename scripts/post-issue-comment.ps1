 [CmdletBinding(DefaultParameterSetName = 'Create')]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[^/]+/[^/]+$')]
    [string]$Repo,

    [Parameter(Mandatory = $true, ParameterSetName = 'Create')]
    [int]$IssueNumber,

    [Parameter(Mandatory = $true, ParameterSetName = 'Update')]
    [int]$CommentId,

    [Parameter(ParameterSetName = 'Create')]
    [Parameter(ParameterSetName = 'Update')]
    [string]$Body,

    [Parameter(ParameterSetName = 'Create')]
    [Parameter(ParameterSetName = 'Update')]
    [string]$BodyFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Body) -and [string]::IsNullOrWhiteSpace($BodyFile)) {
    throw 'Provide either -Body or -BodyFile.'
}

if (-not [string]::IsNullOrWhiteSpace($Body) -and -not [string]::IsNullOrWhiteSpace($BodyFile)) {
    throw 'Use either -Body or -BodyFile, not both.'
}

$finalBody = $Body
if (-not [string]::IsNullOrWhiteSpace($BodyFile)) {
    if (-not (Test-Path -LiteralPath $BodyFile)) {
        throw "Body file not found: $BodyFile"
    }

    $finalBody = Get-Content -LiteralPath $BodyFile -Raw -Encoding UTF8
}

if ([string]::IsNullOrWhiteSpace($finalBody)) {
    throw 'Comment body is empty.'
}

$payload = @{ body = $finalBody } | ConvertTo-Json -Compress
$tmpFile = Join-Path $env:TEMP ("gh-comment-" + [Guid]::NewGuid().ToString() + ".json")

try {
    # gh api --input expects valid JSON bytes; use UTF-8 without BOM for PS 5.1 compatibility.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmpFile, $payload, $utf8NoBom)

    if ($PSCmdlet.ParameterSetName -eq 'Update') {
        $path = "repos/$Repo/issues/comments/$CommentId"
        gh api --method PATCH $path --input $tmpFile | Out-Null
        Write-Host "Updated comment $CommentId in $Repo"
    }
    else {
        $path = "repos/$Repo/issues/$IssueNumber/comments"
        gh api --method POST $path --input $tmpFile | Out-Null
        Write-Host "Posted comment to issue #$IssueNumber in $Repo"
    }
}
finally {
    if (Test-Path -LiteralPath $tmpFile) {
        Remove-Item -LiteralPath $tmpFile -Force
    }
}
