# Cloudflare Worker Setup - Quick Start Guide

## Overview

You now have a Cloudflare Worker that automatically triggers your uptime checks every 5 minutes via GitHub repository dispatch events. This eliminates the need for a GitHub Actions schedule and provides a free, reliable alternative using Cloudflare's global infrastructure.

## What Was Created

### 1. GitHub Workflow
**File**: `.github/workflows/deploy-cloudflare-worker.yml`
- Automatically deploys the Cloudflare Worker when you push changes
- Configured to trigger on changes to the `cloudflare-worker/` directory
- Can also be triggered manually from the Actions tab

### 2. Cloudflare Worker Application
**Directory**: `cloudflare-worker/`

Contains:
- **`src/index.ts`** - TypeScript worker code with cron trigger logic
- **`wrangler.toml`** - Cloudflare Worker configuration with cron schedule (`*/5 * * * *`)
- **`package.json`** - Dependencies and build scripts
- **`tsconfig.json`** - TypeScript configuration
- **`setup.sh`** - Interactive setup helper script
- **`README.md`** - Detailed documentation

## Quick Start

### Step 1: Add GitHub Secrets (Required)

Go to your repository settings and add these secrets:

**Settings → Secrets and variables → Actions → New repository secret**

1. **`CLOUDFLARE_API_TOKEN`**
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Permissions: Workers Scripts (read/write)

2. **`CLOUDFLARE_ACCOUNT_ID`**
   - Get from: https://dash.cloudflare.com/ (right sidebar under API)

3. **`GH_PAT`** (optional - uses github.token if not set)
   - Create at: https://github.com/settings/tokens
   - Scope: `repo` (or `public_repo` for public repos only)

### Step 2: Deploy the Worker

Option A - Automatic (pushes trigger deployment):
```bash
git add cloudflare-worker/
git commit -m "Deploy Cloudflare Worker"
git push origin master
```

Option B - Manual deployment:
```bash
cd cloudflare-worker
chmod +x setup.sh
./setup.sh
```

### Step 3: Verify Deployment

1. Visit your Cloudflare Dashboard: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages → Overview**
3. You should see your `uptime-dispatcher` worker
4. Click on it to view logs and verify the cron trigger is active

## How It Works

```
Every 5 minutes
        ↓
Cloudflare Worker (cron trigger: */5 * * * *)
        ↓
Makes HTTP POST to GitHub API
(https://api.github.com/repos/mleczakm/infrastructure-status/dispatches)
        ↓
Sends repository_dispatch event (type: 'uptime')
        ↓
GitHub Actions Workflow Triggered
(.github/workflows/uptime.yml)
        ↓
Uptime checks run for all monitored sites
```

## Modifying the Schedule

To change how often checks run, edit `cloudflare-worker/wrangler.toml`:

```toml
[trigger]
crons = ["*/5 * * * *"]  # Change this line
```

Cron examples:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours

## Monitoring

### Check Worker Activity
1. Cloudflare Dashboard → Workers → Your worker
2. Click "Logs" to see execution history

### Check GitHub Workflow Runs
1. GitHub: Settings → Actions → All workflows
2. Click on `Uptime CI` to see recent runs

## Troubleshooting

### Worker not deploying
- Check GitHub Actions workflow logs
- Verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are correct
- Ensure you have permission to deploy workers on your Cloudflare account

### Workflow not triggering
- Verify `GH_PAT` has `repo` scope
- Check Cloudflare logs for API errors
- Ensure GitHub repository owner/name in `wrangler.toml` are correct

### Rate Limiting
- GitHub API: 5,000 calls/hour (every 5 minutes = 288/day, well under limit)
- Cloudflare: Free tier is unlimited for cron triggers

## Need Help?

1. **Cloudflare Worker Docs**: https://developers.cloudflare.com/workers/
2. **GitHub Dispatch Docs**: https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event
3. **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

## Cost

- Cloudflare: FREE (free tier workers with cron triggers)
- GitHub Actions: Uses your action minutes, but this saves them by not running on a schedule
- **Total Monthly Cost: $0**

---

**Next**: After deployment, your uptime checks will run automatically every 5 minutes! 🚀

