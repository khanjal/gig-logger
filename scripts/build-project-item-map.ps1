param(
  [Parameter(Mandatory=$true)][string]$ProjectId
)

Set-StrictMode -Version Latest

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh CLI is required. Install from https://cli.github.com/ and authenticate with 'gh auth login'"
  exit 2
}

$query = @'
query($projectId:ID!,$cursor:String){
  node(id:$projectId){
    ... on ProjectV2 {
      items(first:100, after:$cursor){
        pageInfo { endCursor hasNextPage }
        nodes {
          id
          content {
            __typename
            ... on Issue { number repository { name owner { login } } }
          }
        }
      }
    }
  }
}
'@

$map = @{}
$cursor = $null
do {
  if ($cursor) {
    $resp = gh api graphql -f query="$query" -f projectId="$ProjectId" -f cursor="$cursor" 2>$null
  } else {
    $resp = gh api graphql -f query="$query" -f projectId="$ProjectId" 2>$null
  }
  if (-not $resp) { Write-Error "GraphQL query failed"; exit 3 }
  try { $o = $resp | ConvertFrom-Json } catch { Write-Error "Failed to parse GraphQL JSON"; exit 4 }
  if (-not $o.data -or -not $o.data.node -or -not $o.data.node.items) { break }
  $nodes = $o.data.node.items.nodes
  foreach ($n in $nodes) {
    if ($n.content -and $n.content.__typename -eq 'Issue') {
      $num = $n.content.number
      $map[[string]$num] = @{ itemId = $n.id; repo = "$($n.content.repository.owner.login)/$($n.content.repository.name)" }
    }
  }
  $pageInfo = $o.data.node.items.pageInfo
  if ($pageInfo.hasNextPage) { $cursor = $pageInfo.endCursor } else { $cursor = $null }
} while ($cursor)

Write-Output ($map | ConvertTo-Json -Depth 6)
