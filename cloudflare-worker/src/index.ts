/**
 * Cloudflare Worker - GitHub Uptime Dispatcher
 * Triggers the uptime check workflow every 5 minutes via GitHub repository dispatch
 */

interface Env {
  GH_PAT: string;
  GH_OWNER: string;
  GH_REPO: string;
  // Optional: Discord webhook URL (will append /slack for Slack-compatible format)
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
  const startTime = Date.now();
  const { GH_PAT, GH_OWNER, GH_REPO } = env;

  // Structured logging
  const logContext = {
    timestamp: new Date().toISOString(),
    owner: GH_OWNER,
    repo: GH_REPO,
    runId: crypto.randomUUID(),
  };

  console.log('🚀 Starting uptime dispatch', logContext);

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
          client_payload: {
            triggered_by: 'cloudflare-worker',
            timestamp: new Date().toISOString(),
            run_id: logContext.runId,
          },
        }),
      }
    );

    const duration = Date.now() - startTime;
    const logData = { ...logContext, duration, status: response.status };

    if (response.status === 204) {
      console.log('✅ Successfully triggered uptime workflow', logData);
      return Promise.resolve();
    } else {
      const errorText = await response.text();
      const errorData = { ...logData, error: response.statusText, details: errorText };
      console.error('❌ Failed to trigger workflow', errorData);

      // Send alert on failure
      await sendAlert(env, {
        type: 'github_api_error',
        message: `Failed to trigger uptime workflow: ${response.statusText}`,
        details: errorData,
      });

      return Promise.reject(new Error(`GitHub API error: ${response.statusText}`));
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorData = { ...logContext, duration, error: errorMessage, stack: errorStack };
    console.error('❌ Error dispatching workflow', errorData);

    // Send alert on exception
    await sendAlert(env, {
      type: 'worker_exception',
      message: `Exception in uptime dispatcher: ${errorMessage}`,
      details: errorData,
    });

    return Promise.reject(error);
  }
}

async function sendAlert(env: Env, alert: {
  type: string;
  message: string;
  details: any;
}): Promise<void> {
  const { NOTIFICATION_DISCORD_WEBHOOK_URL } = env;

  const alertPayload = {
    timestamp: new Date().toISOString(),
    service: 'uptime-dispatcher',
    ...alert,
  };

  // Send to Discord (with /slack suffix for Slack-compatible format) if configured
  if (NOTIFICATION_DISCORD_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `🚨 ${alert.message}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Service', value: 'uptime-dispatcher', short: true },
            { title: 'Type', value: alert.type, short: true },
            { title: 'Timestamp', value: alertPayload.timestamp, short: false },
          ],
        }],
      };

      // Append /slack to Discord webhook URL for Slack-compatible format
      const discordSlackUrl = NOTIFICATION_DISCORD_WEBHOOK_URL.endsWith('/slack')
        ? NOTIFICATION_DISCORD_WEBHOOK_URL
        : `${NOTIFICATION_DISCORD_WEBHOOK_URL}/slack`;

      await fetch(discordSlackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
      console.log('📢 Alert sent to Discord (Slack format)', { type: alert.type });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send alert to Discord', { error: errorMessage });
    }
  }
}

