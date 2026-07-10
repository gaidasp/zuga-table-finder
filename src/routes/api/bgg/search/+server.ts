import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BGGGame } from '$lib/types';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BGG_XML_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const MAX_RESULTS = 5;

type SearchItem = {
  id: string;
  name: string;
  yearPublished?: string;
};

type ThingDetail = {
  yearPublished?: string;
  image?: string;
};

let cachedDotEnvKey: string | undefined;

const getEnvValueFromDotEnv = (name: string) => {
  if (cachedDotEnvKey !== undefined) {
    return cachedDotEnvKey;
  }

  const envPath = resolve('.env');
  if (!existsSync(envPath)) {
    cachedDotEnvKey = '';
    return cachedDotEnvKey;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  const target = `${name}=`;
  const line = lines.find((candidate) => candidate.trim().startsWith(target));
  cachedDotEnvKey = line ? line.slice(target.length).trim() : '';
  return cachedDotEnvKey;
};

const getBggApiKey = () => process.env.BGG_API_KEY?.trim() || getEnvValueFromDotEnv('BGG_API_KEY');

const decodeXmlEntities = (input: string) =>
  input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const getAttribute = (tag: string, attribute: string) => {
  const match = new RegExp(`${attribute}="([^"]*)"`, 'i').exec(tag);
  return match?.[1];
};

const parseSearchItems = (xml: string): SearchItem[] => {
  const items: SearchItem[] = [];
  const seen = new Set<string>();
  const itemRegex = /<item\b([^>]*)>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null && items.length < MAX_RESULTS) {
    const attrs = itemMatch[1] || '';
    const body = itemMatch[2] || '';
    const id = getAttribute(attrs, 'id');
    if (!id || seen.has(id)) continue;

    const primaryNameTag = /<name\b[^>]*type="primary"[^>]*\/?>/i.exec(body)?.[0];
    const fallbackNameTag = /<name\b[^>]*\/?>/i.exec(body)?.[0];
    const nameTag = primaryNameTag ?? fallbackNameTag;
    const rawName = nameTag ? getAttribute(nameTag, 'value') : null;
    const name = rawName ? decodeXmlEntities(rawName.trim()) : '';
    if (!name) continue;

    const yearTag = /<yearpublished\b[^>]*\/?>/i.exec(body)?.[0];
    const yearPublished = yearTag ? getAttribute(yearTag, 'value') : undefined;

    seen.add(id);
    items.push({ id, name, yearPublished });
  }

  return items;
};

const parseThingDetails = (xml: string): Map<string, ThingDetail> => {
  const details = new Map<string, ThingDetail>();
  const itemRegex = /<item\b([^>]*)>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const attrs = itemMatch[1] || '';
    const body = itemMatch[2] || '';
    const id = getAttribute(attrs, 'id');
    if (!id) continue;

    const yearTag = /<yearpublished\b[^>]*\/?>/i.exec(body)?.[0];
    const yearPublished = yearTag ? getAttribute(yearTag, 'value') : undefined;

    const imageMatch = /<image>([^<]+)<\/image>/i.exec(body);
    const image = imageMatch ? decodeXmlEntities(imageMatch[1].trim()) : undefined;

    details.set(id, { yearPublished, image });
  }

  return details;
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const getRelevanceScore = (query: string, gameName: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedName = gameName.trim().toLowerCase();
  if (!normalizedQuery || !normalizedName) return 0;

  let score = 0;

  if (normalizedName === normalizedQuery) score += 1000;
  if (normalizedName.startsWith(normalizedQuery)) score += 300;
  if (normalizedName.includes(normalizedQuery)) score += 120;

  const queryTokens = tokenize(normalizedQuery);
  const nameTokens = tokenize(normalizedName);
  const tokenSet = new Set(nameTokens);

  let matchedTokenCount = 0;
  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      score += 80;
      matchedTokenCount += 1;
      continue;
    }

    const prefixHit = nameTokens.some((nameToken) => nameToken.startsWith(token));
    if (prefixHit) {
      score += 35;
    }
  }

  if (queryTokens.length > 0 && matchedTokenCount === queryTokens.length) {
    score += 140;
  }

  // Slightly prefer shorter titles when relevance is similar.
  score -= Math.min(normalizedName.length, 120) * 0.1;
  return score;
};

const fetchXml = async (path: string, params: Record<string, string>) => {
  const targetUrl = new URL(`${BGG_XML_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => targetUrl.searchParams.set(key, value));

  const apiKey = getBggApiKey();
  const headers: HeadersInit = {
    Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8'
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, {
    headers
  });

  return response;
};

const fetchThingDetailsWithRetry = async (ids: string[]) => {
  const idsParam = ids.join(',');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchXml('/thing', { id: idsParam, stats: '1', type: 'boardgame' });
    if (response.status === 202) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`BGG thing endpoint returned ${response.status}`);
    }

    return response.text();
  }

  throw new Error('BGG thing endpoint is still preparing data (202) after retries');
};

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q');
  if (!query || query.trim().length < 2) return json({ games: [] });

  try {
    const q = query.trim();
    const searchResponse = await fetchXml('/search', {
      query: q,
      type: 'boardgame',
      exact: '0'
    });
    if (!searchResponse.ok) {
      throw new Error(`BGG search endpoint returned ${searchResponse.status}`);
    }

    const searchXml = await searchResponse.text();
    const searchItems = parseSearchItems(searchXml).slice(0, MAX_RESULTS);

    if (searchItems.length === 0) {
      return json({ games: [] });
    }

    const detailsXml = await fetchThingDetailsWithRetry(searchItems.map((item) => item.id));
    const detailsById = parseThingDetails(detailsXml);

    const games: BGGGame[] = searchItems
      .map((item) => {
        const detail = detailsById.get(item.id);
        return {
          id: item.id,
          name: item.name,
          yearPublished: detail?.yearPublished ?? item.yearPublished,
          image: detail?.image,
          url: `https://boardgamegeek.com/boardgame/${item.id}`
        };
      })
      .sort((a, b) => {
        const byScore = getRelevanceScore(q, b.name) - getRelevanceScore(q, a.name);
        if (byScore !== 0) return byScore;

        const aYear = Number(a.yearPublished ?? 0);
        const bYear = Number(b.yearPublished ?? 0);
        if (aYear !== bYear) return bYear - aYear;

        return a.name.localeCompare(b.name);
      });

    return json({ games });
  } catch (err) {
    console.error('[BGG XML API2] Error:', err instanceof Error ? err.message : String(err));
    return json({ games: [], error: 'BGG XML API2 search failed' }, { status: 500 });
  }
};
