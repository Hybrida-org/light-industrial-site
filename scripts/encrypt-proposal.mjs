#!/usr/bin/env node
// Encrypts a proposal deck into proposal/<code>/index.html behind a password gate.
// Usage: node scripts/encrypt-proposal.mjs <client-copy.html> [--code abc123] [--password ...]
// Prints the URL and password. The password is never written to disk. See docs/proposals.md.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ITER = 600000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
const src = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!src) { console.error('Usage: node scripts/encrypt-proposal.mjs <client-copy.html> [--code abc123] [--password ...]'); process.exit(1); }

const pick = (alphabet, n) => {
  let out = '';
  while (out.length < n) {
    for (const b of crypto.getRandomValues(new Uint8Array(n * 2))) {
      if (b < 256 - (256 % alphabet.length) && out.length < n) out += alphabet[b % alphabet.length];
    }
  }
  return out;
};
const code = opt('--code') || pick('abcdefghijklmnopqrstuvwxyz0123456789', 6);
const password = opt('--password') || pick('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', 16);
if (!/^[a-z0-9-]{4,40}$/.test(code)) { console.error('Code must be 4-40 chars of a-z, 0-9, -'); process.exit(1); }
const outDir = join(root, 'proposal', code);
if (existsSync(outDir) && !args.includes('--force')) { console.error(`proposal/${code} exists. Pass --force to overwrite.`); process.exit(1); }

const html = readFileSync(src, 'utf8');
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html)));
const b64 = (u) => Buffer.from(u).toString('base64');

const tpl = readFileSync(join(root, 'scripts', 'proposal-gate.html'), 'utf8');
const gate = tpl.replace('__PAYLOAD__', () => JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), gate);

// Self-check: the written page holds no plaintext and decrypts with the password.
const out = readFileSync(join(outDir, 'index.html'), 'utf8');
const sample = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter((w) => w.length > 6).slice(0, 50);
if (sample.some((w) => out.includes(w) && !tpl.includes(w))) throw new Error('Plaintext leaked into the output');
const p = JSON.parse(out.match(/<script type="application\/json" id="payload">(.*?)<\/script>/s)[1]);
const k2 = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(p.salt, 'base64'), iterations: p.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
const back = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(p.iv, 'base64') }, k2, Buffer.from(p.ct, 'base64')));
if (back !== html) throw new Error('Round trip failed');

console.log(`URL:      https://lightindustrial.co.za/proposal/${code}/`);
console.log(`Password: ${password}`);
