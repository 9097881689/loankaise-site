#!/usr/bin/env node
/**
 * LoanKaise.in — Real Search Engine Auto-Indexing Notifier
 * 1. Google WebSub / PubSubHubbub Hub Ping (https://pubsubhubbub.appspot.com/) - No API key needed
 * 2. IndexNow API (Bing, Yandex, DuckDuckGo instant indexing) - Uses /loankaise-indexnow-2026.txt
 * 3. Google Search Console Indexing API (https://indexing.googleapis.com/v3/urlNotifications:publish)
 *    Automatically runs whenever data/google-service-account.json or GOOGLE_SERVICE_ACCOUNT_JSON is set.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVICE_ACCOUNT_PATH = path.join(ROOT, 'data', 'google-service-account.json');
const INDEXNOW_KEY = 'loankaise-indexnow-2026';

function base64UrlEncode(bufOrStr) {
  const buf = typeof bufOrStr === 'string' ? Buffer.from(bufOrStr, 'utf8') : Buffer.from(bufOrStr);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function loadServiceAccountJson() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch {
      return null;
    }
  }
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

async function getGoogleAccessToken(creds) {
  if (!creds?.client_email || !creds?.private_key) {
    throw new Error('Invalid Service Account JSON: missing client_email or private_key');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  sign.end();
  const sig = base64UrlEncode(sign.sign(creds.private_key));
  const assertion = `${unsigned}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`OAuth token error (${tokenRes.status}): ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

export async function notifySearchEngines(urls = []) {
  const cleanUrls = urls
    .map((u) => (u.startsWith('http') ? u : `https://loankaise.in${u.startsWith('/') ? '' : '/'}${u}`))
    .filter(Boolean);

  if (cleanUrls.length === 0) return { websub: null, indexNow: null, googleIndexing: [] };

  const summary = { websub: null, indexNow: null, googleIndexing: [] };

  // 1. Google WebSub / PubSubHubbub (RSS real-time notification)
  try {
    const wsRes = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'hub.mode': 'publish',
        'hub.url': 'https://loankaise.in/feed.xml',
      }).toString(),
    });
    summary.websub = wsRes.status;
    console.log(`[indexing] WebSub Hub (Google RSS push): HTTP ${wsRes.status}`);
  } catch (err) {
    console.warn('[indexing] WebSub warn:', err.message);
  }

  // 2. IndexNow (Bing / Yandex / DuckDuckGo instant indexing)
  try {
    const inRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'loankaise.in',
        key: INDEXNOW_KEY,
        keyLocation: `https://loankaise.in/${INDEXNOW_KEY}.txt`,
        urlList: cleanUrls,
      }),
    });
    summary.indexNow = inRes.status;
    console.log(`[indexing] IndexNow (Bing/DuckDuckGo/Yandex): HTTP ${inRes.status} for ${cleanUrls.length} URL(s)`);
  } catch (err) {
    console.warn('[indexing] IndexNow warn:', err.message);
  }

  // 3. Google Search Console Indexing API (requires Service Account JSON)
  const creds = loadServiceAccountJson();
  if (creds) {
    try {
      const accessToken = await getGoogleAccessToken(creds);
      for (const targetUrl of cleanUrls) {
        const gRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url: targetUrl, type: 'URL_UPDATED' }),
        });
        const gBody = await gRes.json().catch(() => ({}));
        summary.googleIndexing.push({ url: targetUrl, status: gRes.status, ok: gRes.ok });
        console.log(`[indexing] Google Indexing API (${targetUrl}): HTTP ${gRes.status} ${gRes.ok ? 'OK' : JSON.stringify(gBody)}`);
      }
    } catch (err) {
      console.warn('[indexing] Google Indexing API error:', err.message);
    }
  } else {
    console.log('[indexing] Google Indexing API skipped (add data/google-service-account.json to enable direct URL_UPDATED API calls).');
  }

  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inputUrls = process.argv.slice(2);
  if (inputUrls.length === 0) {
    console.log('Usage: node scripts/google_indexing.mjs https://loankaise.in/news/example/');
    process.exit(0);
  }
  notifySearchEngines(inputUrls).then(() => process.exit(0));
}
