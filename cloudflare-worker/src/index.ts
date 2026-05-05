interface Env {
  GH_PAT: string;
  GH_OWNER: string;
  GH_REPO: string;
  NOTIFICATION_DISCORD_WEBHOOK_URL?: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env));
  },

  async fetch(): Promise<Response> {
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
      console.log('✅ Uptime workflow triggered');
      return;
    } else {
      const errorText = await response.text();
      console.error(`❌ GitHub API error: ${response.status} ${errorText}`);
      await sendDiscordAlert(env, `GitHub API error: ${response.status}`);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Worker error: ${message}`);
    await sendDiscordAlert(env, `Worker error: ${message}`);
  }
}

async function sendDiscordAlert(env: Env, message: string): Promise<void> {
  const { NOTIFICATION_DISCORD_WEBHOOK_URL } = env;
  
  if (!NOTIFICATION_DISCORD_WEBHOOK_URL) return;

  try {
    const webhookUrl = NOTIFICATION_DISCORD_WEBHOOK_URL.endsWith('/slack') 
      ? NOTIFICATION_DISCORD_WEBHOOK_URL 
      : `${NOTIFICATION_DISCORD_WEBHOOK_URL}/slack`;
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${message}`,
        username: 'Upptime Dispatcher',
      }),
    });
    console.log('📢 Alert sent to Discord');
  } catch (error) {
    console.error('❌ Failed to send Discord alert');
  }
}