param(
  [Parameter(Mandatory=$true)][string]$ProjectId
)

$query = 'query($projectId:ID!){ node(id:$projectId){ ... on ProjectV2{ fields(first:50){ nodes{ __typename ... on ProjectV2SingleSelectField{ id name options{ id name } } } } } } }'
$resp = gh api graphql -f query="$query" -f projectId="$ProjectId" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "Failed: $resp"; exit 1 }
$o = $resp | ConvertFrom-Json
$fields = $o.data.node.fields.nodes

foreach ($f in $fields) {
  if ($f.__typename -eq 'ProjectV2SingleSelectField') {
    Write-Host "`nField: $($f.name)" -ForegroundColor Cyan
    Write-Host "Field ID: $($f.id)" -ForegroundColor Yellow
    Write-Host "Options:"
    foreach ($opt in $f.options) {
      Write-Host "  - $($opt.name)" -ForegroundColor Green
      Write-Host "    ID: $($opt.id)" -ForegroundColor Gray
    }
  }
}
