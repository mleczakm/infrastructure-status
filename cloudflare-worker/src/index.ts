/**
 * Cloudflare Worker - GitHub Uptime Dispatcher
 * Triggers the uptime check workflow every 5 minutes via GitHub repository dispatch
 */

interface Env {
  GH_PAT: string;
  GH_OWNER: string;
  GH_REPO: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env));
  },

  async fetch(request: Request): Promise<Response> {
    return new Response('Uptime Dispatcher Worker is running', { status: 200 });
  },
};

async function handleScheduled(env: Env): Promise<void> {
  const { GH_PAT, GH_OWNER, GH_REPO } = env;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${GH_PAT}`,
          'Content-Type': 'application/json',
          'User-Agent': `${GH_OWNER}-uptime-dispatcher`,
        },
        body: JSON.stringify({
          event_type: 'uptime',
        }),
      }
    );

    if (response.status === 204) {
      console.log('✅ Successfully triggered uptime workflow');
      return Promise.resolve();
    } else {
      console.error(`❌ Failed to trigger workflow: ${response.statusText}`);
      return Promise.reject(new Error(`GitHub API error: ${response.statusText}`));
    }
  } catch (error) {
    console.error(`❌ Error dispatching workflow: ${error}`);
    return Promise.reject(error);
  }
}

