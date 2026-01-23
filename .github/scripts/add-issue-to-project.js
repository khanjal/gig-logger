#!/usr/bin/env node
const fs = require('fs')

const token = process.env.GITHUB_TOKEN
if (!token) { console.error('GITHUB_TOKEN is required'); process.exit(1) }

const eventPath = process.env.GITHUB_EVENT_PATH
if (!eventPath || !fs.existsSync(eventPath)) { console.error('GITHUB_EVENT_PATH not found'); process.exit(1) }

const raw = fs.readFileSync(eventPath, 'utf8')
let payload = {}
try { payload = JSON.parse(raw) } catch (e) { console.error('Invalid event payload', e); process.exit(1) }

const issue = payload.issue
if (!issue) { console.log('No issue in event payload; nothing to do.'); process.exit(0) }

const projectIdEnv = process.env.PROJECT_V2_ID || ''
const projectNameEnv = process.env.PROJECT_V2_NAME || ''
const columnName = (process.env.PROJECT_COLUMN_NAME || 'New')
const repo = process.env.GITHUB_REPOSITORY || ''
const owner = repo.split('/')[0]

async function graphql(query, vars) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${token}`
    },
    body: JSON.stringify({ query, variables: vars })
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch (e) { throw new Error('Invalid JSON response: ' + text) }
}

function normalizeText(s) {
  if (!s) return ''
  const noEmoji = s.replace(/[\u0000-\u001F\u007F-\u007F]|[\u{1F300}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
  return noEmoji.normalize('NFKD').replace(/[^0-9a-zA-Z\s]/g, '').toLowerCase().trim()
}

;(async function main(){
  try {
    let projectId = projectIdEnv

    if (!projectId && projectNameEnv) {
      const listQuery = `query($login:String!){ user(login:$login){ projectsV2(first:100){ nodes{ id title } } } organization(login:$login){ projectsV2(first:100){ nodes{ id title } } } }`
      const listResp = await graphql(listQuery, { login: owner })
      const userNodes = (listResp?.data?.user?.projectsV2?.nodes) || []
      const orgNodes = (listResp?.data?.organization?.projectsV2?.nodes) || []
      const all = [...userNodes, ...orgNodes]
      const lowerName = normalizeText(projectNameEnv)
      const found = all.find(p => (p.title || '').toLowerCase().includes(lowerName))
      if (found) { projectId = found.id; console.log(`Resolved project '${found.title}' -> ${projectId}`) }
      else { console.log(`Project with name containing '${projectNameEnv}' not found for owner ${owner}`) }
    }

    if (!projectId) { console.log('No project ID available after lookup — aborting'); return }

    const issueNodeId = issue.node_id

    const addMutation = `mutation($projectId:ID!,$contentId:ID!){ addProjectV2ItemById(input:{projectId:$projectId,contentId:$contentId}){ item{ id } } }`
    const addResp = await graphql(addMutation, { projectId, contentId: issueNodeId })
    const itemId = addResp?.data?.addProjectV2ItemById?.item?.id
    if (!itemId) { console.log('Could not create project item or it already exists'); return }
    console.log(`Created project item ${itemId} for issue ${issue.number}`)

    const normColumn = normalizeText(columnName)

    const fieldsQuery = `query($projectId:ID!){ node(id:$projectId){ ... on ProjectV2{ fields(first:50){ nodes{ __typename ... on ProjectV2SingleSelectField{ id name options{ id name } } } } } } }`
    const fieldsResp = await graphql(fieldsQuery, { projectId })
    const nodes = (fieldsResp?.data?.node?.fields?.nodes) || []
    let fieldId = null; let optionId = null
    for (const f of nodes) {
      if (f.__typename === 'ProjectV2SingleSelectField') {
        for (const opt of (f.options || [])) {
          const optNorm = normalizeText(opt.name || '')
          if (!optNorm) continue
          if (optNorm === normColumn || optNorm.includes(normColumn) || normColumn.includes(optNorm)) {
            fieldId = f.id; optionId = opt.id; break
          }
        }
      }
      if (fieldId && optionId) break
    }

    if (fieldId && optionId) {
      const updateMutation = `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:ID!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:{singleSelectOptionId:$optionId}}){ item{ id } } }`
      await graphql(updateMutation, { projectId, itemId, fieldId, optionId })
      console.log(`Set project column '${columnName}' on item ${itemId}`)
    } else {
      console.log(`Column option '${columnName}' not found on project ${projectId}`)
    }
  } catch (err) {
    console.error('Failed to add issue to project:', err)
    process.exitCode = 1
  }
})()
