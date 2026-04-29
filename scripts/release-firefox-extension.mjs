import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const extDir = join(rootDir, 'browser-extension-firefox');
const distDir = join(extDir, 'dist');
const releaseDir = join(extDir, 'release');
const manifestPath = join(extDir, 'manifest.json');

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

if (!existsSync(manifestPath)) {
  fail(`Missing manifest at ${manifestPath}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = manifest.version;
const addonId = manifest?.browser_specific_settings?.gecko?.id;
const updateUrl = manifest?.browser_specific_settings?.gecko?.update_url;

if (!version) {
  fail('manifest.json is missing version');
}

if (!addonId) {
  fail('manifest.json is missing browser_specific_settings.gecko.id');
}

if (!updateUrl || updateUrl.includes('YOUR_STATIC_HOST')) {
  fail('Set browser_specific_settings.gecko.update_url to your real hosted updates.json URL');
}

const updateUrlObj = new URL(updateUrl);
const updatesBaseUrl = updateUrl.replace(/\/updates\.json$/, '');
if (updatesBaseUrl === updateUrl) {
  fail('update_url must end with /updates.json');
}

if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
  fail('Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET in your environment before running release');
}

mkdirSync(distDir, { recursive: true });
mkdirSync(releaseDir, { recursive: true });

console.log(`Signing Firefox extension ${version}...`);
execFileSync(
  'npx',
  [
    'web-ext',
    'sign',
    '--source-dir',
    extDir,
    '--channel',
    'unlisted',
    '--artifacts-dir',
    distDir,
  ],
  { stdio: 'inherit', env: process.env }
);

const signedXpis = readdirSync(distDir)
  .filter((name) => name.endsWith('.xpi'))
  .map((name) => ({ name, mtime: statSync(join(distDir, name)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (signedXpis.length === 0) {
  fail(`No signed XPI found in ${distDir}`);
}

const latestXpiName = signedXpis[0].name;
const latestXpiPath = join(distDir, latestXpiName);
const releaseXpiName = `stash-firefox-extension-${version}.xpi`;
const releaseXpiPath = join(releaseDir, releaseXpiName);
copyFileSync(latestXpiPath, releaseXpiPath);

const updateManifest = {
  addons: {
    [addonId]: {
      updates: [
        {
          version,
          update_link: `${updatesBaseUrl}/${releaseXpiName}`,
        },
      ],
    },
  },
};

const updatesPath = join(releaseDir, 'updates.json');
writeFileSync(updatesPath, `${JSON.stringify(updateManifest, null, 2)}\n`, 'utf8');

console.log('\nRelease artifacts updated:');
console.log(`- ${releaseXpiPath}`);
console.log(`- ${updatesPath}`);
console.log('\nNext: publish browser-extension-firefox/release/ to your static host, then push git.');
console.log(`Expected update feed URL: ${updateUrlObj.toString()}`);
