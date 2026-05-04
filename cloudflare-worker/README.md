# Cloudflare Worker - Uptime Dispatcher

This directory contains the Cloudflare Worker configuration and code that automatically triggers the uptime checks every 5 minutes.

## Prerequisites

1. **Cloudflare Account**: Free tier is sufficient
2. **GitHub Personal Access Token**: For triggering repository dispatch events
3. **GitHub Secrets**: Configure the required secrets in your repository

## Setup Instructions

### 1. Create a Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Account Settings → API Tokens
3. Create a new token with permissions:
   - **Account** → **Workers Scripts** → **Edit**
4. Copy the API token

### 2. Get Your Cloudflare Account ID

1. In Cloudflare Dashboard, the Account ID is displayed on the right sidebar under "API"
2. Copy your Account ID

### 3. Create/Verify GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal access tokens](https://github.com/settings/tokens)
2. Create a new token (or use existing) with scope:
   - `repo` (full control of private repositories) - or just `public_repo` if you only need access to public repos
3. Copy the token

### 4. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

- **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API token
- **`CLOUDFLARE_ACCOUNT_ID`**: Your Cloudflare Account ID
- **`GH_PAT`**: Your GitHub Personal Access Token (optional - will use default `github.token` if not provided)

To add secrets:
1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its corresponding value

### 5. Deploy the Worker

The worker will be automatically deployed when you:
- Push changes to the `cloudflare-worker/` directory
- Manually trigger the workflow from the "Actions" tab

Or deploy manually with:

```bash
cd cloudflare-worker
npm install
npx wrangler deploy --env production
```

## How It Works

1. **Cron Trigger**: The Cloudflare Worker is scheduled to run every 5 minutes (via the `*/5 * * * *` cron expression)
2. **API Call**: When triggered, it makes a POST request to the GitHub API endpoint: `https://api.github.com/repos/mleczakm/infrastructure-status/dispatches`
3. **Event Dispatch**: Sends a `repository_dispatch` event with type `uptime`
4. **Workflow Trigger**: The existing `uptime.yml` workflow picks up this event and runs the status checks

## Cron Expression

The worker runs on: `*/5 * * * *` (every 5 minutes)

To modify the frequency, update the `triggers.crons` value in `wrangler.toml`

Cron format: `minute hour day_of_month month day_of_week`

Examples:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight

## Troubleshooting

### Worker not triggering
1. Check Cloudflare Dashboard → Workers → Your worker name
2. Verify the cron trigger is configured
3. Check Cloudflare Logs for errors

### GitHub workflow not triggered
1. Verify `GH_PAT` secret is correctly set
2. Check that the token has `repo` scope
3. Verify repository name and owner are correct in `wrangler.toml`
4. Check GitHub Actions workflow logs

### Rate Limiting
GitHub's API has rate limits. Free tier allows:
- 5,000 API calls per hour
- Every 5 minutes = 288 API calls per day (well within limits)

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Repository Dispatches](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-dispatch-event)

