import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (name) => readFile(path.join(root, name), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG', 'not a PNG file');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('manifest is installable and declares the right app metadata', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));

  assert.equal(manifest.name, 'Christmas 2026 · 25 Days of the Word');
  assert.equal(manifest.short_name, 'Christmas 2026');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.display_override.includes('standalone'));
  assert.equal(manifest.start_url, './?source=pwa');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.orientation, 'portrait');
  assert.match(manifest.theme_color, /^#[0-9A-F]{6}$/i);
  assert.match(manifest.background_color, /^#[0-9A-F]{6}$/i);

  const sizes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose}`);
  assert.ok(sizes.includes('192x192:any'), 'missing 192px any icon');
  assert.ok(sizes.includes('512x512:any'), 'missing 512px any icon');
  assert.ok(sizes.includes('512x512:maskable'), 'missing maskable icon');
});

test('every manifest icon exists at its declared size', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));

  for (const icon of manifest.icons) {
    const buffer = await readFile(path.join(root, icon.src));
    const { width, height } = pngSize(buffer);
    assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} has the wrong dimensions`);
  }
});

test('shortcuts point at real app views', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  const allowed = new Set(['today', 'notes', 'together', 'journey']);

  for (const shortcut of manifest.shortcuts || []) {
    const url = new URL(shortcut.url, 'https://example.test/');
    assert.ok(allowed.has(url.searchParams.get('view')), `unknown view in ${shortcut.url}`);
  }
});

test('iOS and browser install metadata is present', async () => {
  const html = await read('index.html');

  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon"[^>]*apple-touch-icon\.png/);
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="mobile-web-app-capable" content="yes"/);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /id="installBtn"/);
  assert.match(html, /id="installSettingsBtn"/);
  assert.match(html, /src="js\/pwa\.js"/);
});

test('the offline shell caches the app, icons, and pwa glue', async () => {
  const sw = await read('sw.js');
  const assets = [...sw.matchAll(/'([^']+)'/g)].map((match) => match[1]);

  for (const file of ['index.html', 'styles.css', 'manifest.webmanifest', 'js/app.js', 'js/pwa.js',
    'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) {
    assert.ok(assets.includes(file), `sw.js does not cache ${file}`);
    await access(path.join(root, file));
  }

  assert.match(sw, /const CACHE = 'xmas2026-shell-v\d+';/);
});
