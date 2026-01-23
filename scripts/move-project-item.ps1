param(
  [Parameter(Mandatory=$true)][string]$Repo,
  [Parameter(Mandatory=$true)][int[]]$IssueNumbers,
  [string]$ColumnName,
  [string]$ProjectName = "RaptorGig Board",
  [string]$FieldId = $null,
  [string]$OptionId = $null,
  [switch]$DumpMap
)

Set-StrictMode -Version Latest

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh CLI is required. Install from https://cli.github.com/ and authenticate with 'gh auth login'"
  exit 2
}

$owner = $Repo.Split('/')[0]
$name = $Repo.Split('/')[1]

function Get-ProjectId($owner, $projectName) {
  $query = 'query($login:String!){ user(login:$login){ projectsV2(first:20){ nodes{ id title } } } }'
  $resp = gh api graphql -f query="$query" -f login="$owner" 2>$null
  if (-not $resp) { return $null }
  try { $o = $resp | ConvertFrom-Json } catch { return $null }
  $projects = $o.data.user.projectsV2.nodes
  foreach ($p in $projects) {
    if ($p.title -like "*$projectName*") { return $p.id }
  }
  return $null
}

function Get-IssueNodeId($repo, $number) {
  $json = gh issue view $number --repo $repo --json nodeId 2>$null
  if (-not $json) { return $null }
  try { $obj = $json | ConvertFrom-Json } catch { return $null }
  return $obj.nodeId
}

function Find-ProjectItemIdForIssue($projectId, $repoOwner, $repoName, $issueNumber) {
  $query = @'
query($projectId:ID!,$cursor:String) {
  node(id:$projectId) {
    ... on ProjectV2 {
      items(first:100, after:$cursor) {
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

  $cursor = $null
  do {
    if ($cursor) {
      $resp = gh api graphql -f query="$query" -f projectId="$projectId" -f cursor="$cursor" 2>$null
    } else {
      $resp = gh api graphql -f query="$query" -f projectId="$projectId" 2>$null
    }
    if (-not $resp) { return $null }
    try { $o = $resp | ConvertFrom-Json } catch { return $null }
    if (-not $o.data -or -not $o.data.node -or -not $o.data.node.items) { return $null }
    $nodes = $o.data.node.items.nodes
    foreach ($n in $nodes) {
      if ($n.content -and $n.content.__typename -eq 'Issue') {
        if ($n.content.number -eq $issueNumber -and $n.content.repository.name -eq $repoName -and $n.content.repository.owner.login -eq $repoOwner) { return $n.id }
      }
    }
    $pageInfo = $o.data.node.items.pageInfo
    if ($pageInfo.hasNextPage) { $cursor = $pageInfo.endCursor } else { $cursor = $null }
  } while ($cursor)

  return $null
}

function Build-ProjectItemMap($projectId) {
  $query = @'
query($projectId:ID!,$cursor:String) {
  node(id:$projectId) {
    ... on ProjectV2 {
      items(first:100, after:$cursor) {
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
      $resp = gh api graphql -f query="$query" -f projectId="$projectId" -f cursor="$cursor" 2>$null
    } else {
      $resp = gh api graphql -f query="$query" -f projectId="$projectId" 2>$null
    }
    if (-not $resp) { break }
    try { $o = $resp | ConvertFrom-Json } catch { break }
    if (-not $o.data -or -not $o.data.node -or -not $o.data.node.items) { break }
    $nodes = $o.data.node.items.nodes
    foreach ($n in $nodes) {
      if ($n.content -and $n.content.__typename -eq 'Issue') {
        $num = $n.content.number
        $map[[string]$num] = $n.id
      }
    }
    $pageInfo = $o.data.node.items.pageInfo
    if ($pageInfo.hasNextPage) { $cursor = $pageInfo.endCursor } else { $cursor = $null }
  } while ($cursor)

  return $map
}

function Get-ProjectSingleSelectFieldOption($projectId, $optionName) {
  $query = 'query($projectId:ID!){ node(id:$projectId){ ... on ProjectV2{ fields(first:50){ nodes{ __typename ... on ProjectV2SingleSelectField{ id name options{ id name } } } } } } }'
  $resp = gh api graphql -f query="$query" -f projectId="$projectId" 2>$null
  if (-not $resp) { return $null }
  try { $o = $resp | ConvertFrom-Json } catch { return $null }
  $fields = $o.data.node.fields.nodes
  foreach ($f in $fields) {
    if ($f.__typename -eq 'ProjectV2SingleSelectField') {
      foreach ($opt in $f.options) {
        if ($opt.name -like "*$optionName*") { return @{ fieldId = $f.id; optionId = $opt.id } }
      }
    }
  }
  return $null
}

function Set-ItemSingleSelect($projectId, $itemId, $fieldId, $optionId) {
  $mutation = 'mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:String!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:{singleSelectOptionId:$optionId}}){ projectV2Item{ id } } }'
  $resp = gh api graphql -f query="$mutation" -f projectId="$projectId" -f itemId="$itemId" -f fieldId="$fieldId" -f optionId="$optionId" 2>&1
  if ($LASTEXITCODE -ne 0) { 
    Write-Host "Error updating field: $resp" -ForegroundColor Red
    return $false 
  }
  try { $o = $resp | ConvertFrom-Json } catch { return $false }
  return ($o.data.updateProjectV2ItemFieldValue.projectV2Item.id -ne $null)
}

Write-Host "Looking up project: $ProjectName"
$ProjectId = Get-ProjectId $owner $ProjectName
if (-not $ProjectId) { Write-Error "Project '$ProjectName' not found for owner $owner"; exit 3 }
Write-Host "Found project ID: $ProjectId"

$fieldOpt = $null
if ($FieldId -and $OptionId) {
  $fieldOpt = @{ fieldId = $FieldId; optionId = $OptionId }
  Write-Host "Using provided Field ID: $FieldId, Option ID: $OptionId"
} else {
  if (-not $ColumnName) { Write-Error "Either -ColumnName or both -FieldId and -OptionId must be provided."; exit 3 }
  Write-Host "Looking up column: $ColumnName"
  $fieldOpt = Get-ProjectSingleSelectFieldOption $ProjectId $ColumnName
  if (-not $fieldOpt) { Write-Error "Column '$ColumnName' not found on project $ProjectId"; exit 3 }
  Write-Host "Found - Field ID: $($fieldOpt.fieldId), Option ID: $($fieldOpt.optionId)"
}

foreach ($num in $IssueNumbers) {
  Write-Host "Processing issue #$num"
  $itemId = Find-ProjectItemIdForIssue $ProjectId $owner $name $num
  if (-not $itemId) { Write-Warning "Project item not found for issue #$num"; continue }
  Write-Host " -> item $itemId; setting field $($fieldOpt.fieldId) to option $($fieldOpt.optionId)"
  $result = Set-ItemSingleSelect $ProjectId $itemId $fieldOpt.fieldId $fieldOpt.optionId
  if ($result) {
    Write-Host " -> SUCCESS" -ForegroundColor Green
  } else {
    Write-Host " -> FAILED" -ForegroundColor Red
  }
}

if ($DumpMap) {
  Write-Host "Building project item map..."
  $m = Build-ProjectItemMap $ProjectId
  foreach ($k in $m.Keys) { Write-Host "issue=$k item=$($m[$k])" }
  exit 0
}

Write-Host "Done."
