import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BGGGame } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q');
  if (!query || query.trim().length < 2) return json({ games: [] });

  try {
    const q = query.trim();
    const searchUrl = `https://boardgamegeek.com/search/boardgame?nosession=1&q=${encodeURIComponent(
      q
    )}&showcount=5`;

    console.log('[BGG HTML] Fetching:', searchUrl);

    const res = await fetch(searchUrl, {
      headers: {
        // 'User-Agent': 'ZugaTableFinder/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log('[BGG HTML] Response status', res.status);
    if (!res.ok) throw new Error(`BGG HTML search returned ${res.status}`);

    const html = await res.text();

    // Extract anchors linking to /boardgame/<id>/...
    const games: BGGGame[] = [];
    const seen = new Set<string>();
    const anchorRe = /<a[^>]+href="\/boardgame\/(\d+)[^"']*"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;

    while ((m = anchorRe.exec(html)) !== null && games.length < 5) {
      const id = m[1];
      let name = (m[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      if (seen.has(id)) continue;
      seen.add(id);

      // Try to locate a year near this anchor (simple heuristic)
      const after = html.slice(m.index, Math.min(html.length, m.index + 300));
      const yearMatch = /\b(19|20)\d{2}\b/.exec(after);
      const year = yearMatch ? yearMatch[0] : undefined;

      games.push({ id, name, yearPublished: year, url: `https://boardgamegeek.com/boardgame/${id}` });
    }

    console.log('[BGG HTML] Parsed games:', games);
    return json({ games });
  } catch (err) {
    console.error('[BGG HTML] Error:', err instanceof Error ? err.message : String(err));
    return json({ games: [], error: 'BGG HTML search failed' }, { status: 500 });
  }
};
