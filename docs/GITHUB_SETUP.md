# GitHub repository setup

Run the helper script below locally (requires `gh` CLI and appropriate permissions) to create labels and example issues and to help link the repo to your existing Project board.

1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`
3. Run the setup script (replace with your repo):

```bash
bash scripts/github-setup.sh khanjal/gig-logger
```

Creating a Project board connection and moving cards requires project permissions. You can use `gh` to list projects and add cards; example below:

```bash
# List your projects
gh project list --owner khanjal

# Create an issue and add to project (project id or name needed)
gh issue create --title "Example" --body "Example issue" --repo khanjal/gig-logger
# Then add card to project via web UI or GitHub web
```

Notes:
- The provided `deploy-amplify.yml` workflow requires AWS secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` configured in repo secrets.
- Adjust `CODEOWNERS` and templates to match your org conventions.
