import { PostHog } from "posthog-node";

let cached: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!key) return null;
  if (!cached) {
    cached = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  }
  return cached;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
  await client.shutdown();
}
