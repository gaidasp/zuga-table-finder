// Test script: fetch BGG HTML search page and extract up to 5 games
(async () => {
  const query = process.argv[2] || 'catan';
  const url = `https://boardgamegeek.com/search/boardgame?nosession=1&q=${encodeURIComponent(query)}&showcount=5`;
  console.log('Fetching', url);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log('Status:', res.status);
    const html = await res.text();

    // Regex to find anchors to /boardgame/<id>/... and text inside
    const anchorRe = /<a[^>]+href="\/boardgame\/(\d+)[^"']*"[^>]*>([\s\S]*?)<\/a>/gi;
    const games = [];
    const seen = new Set();
    let m;
    while ((m = anchorRe.exec(html)) !== null && games.length < 5) {
      const id = m[1];
      let name = (m[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!name) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      // try find year nearby
      const after = html.slice(m.index, Math.min(html.length, m.index + 300));
      const yearMatch = /\b(19|20)\d{2}\b/.exec(after);
      const year = yearMatch ? yearMatch[0] : undefined;
      games.push({ id, name, yearPublished: year });
    }

    console.log('Parsed games:', JSON.stringify(games, null, 2));
  } catch (err) {
    console.error('Error fetching/parsing:', err?.message ?? err);
  }
})();
