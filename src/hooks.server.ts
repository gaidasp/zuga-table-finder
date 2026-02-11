import type { Handle } from '@sveltejs/kit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;
const blocks = new Map<string, number>();
const hits = new Map<string, { count: number; windowStart: number }>();

const cleanInterval = 10 * 60_000;
let lastClean = Date.now();

export const handle: Handle = async ({ event, resolve }) => {
  const now = Date.now();
  const ip = event.getClientAddress();

  if (lastClean + cleanInterval < now) {
    for (const [key, value] of hits) {
      if (value.windowStart + WINDOW_MS < now) hits.delete(key);
    }
    for (const [key, value] of blocks) {
      if (value < now) blocks.delete(key);
    }
    lastClean = now;
  }

  const blockedUntil = blocks.get(ip);
  if (blockedUntil && blockedUntil > now) {
    return new Response('Troppe richieste. Riprova piu tardi.', { status: 429 });
  }

  const record = hits.get(ip) ?? { count: 0, windowStart: now };
  const windowReset = record.windowStart + WINDOW_MS;
  const withinWindow = windowReset > now;

  const nextRecord = withinWindow
    ? { ...record, count: record.count + 1 }
    : { count: 1, windowStart: now };

  hits.set(ip, nextRecord);

  if (nextRecord.count > MAX_REQUESTS) {
    const blockUntil = now + 5 * WINDOW_MS;
    blocks.set(ip, blockUntil);
    return new Response('Troppe richieste. Rallenta.', {
      status: 429,
      headers: {
        'retry-after': Math.ceil((blockUntil - now) / 1000).toString()
      }
    });
  }

  const response = await resolve(event);

  response.headers.set('x-ratelimit-remaining', String(Math.max(0, MAX_REQUESTS - nextRecord.count)));
  response.headers.set('x-ratelimit-reset', String(Math.ceil(windowReset / 1000)));

  return response;
};
