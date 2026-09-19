#!/usr/bin/env node
'use strict';

/**
 * verify-push.js
 *
 * Git pre-push quality gate for TicketBox Monorepo (pnpm).
 * Detects whether changed files belong to Web, Admin, BE, Mobile, or shared,
 * then runs only the relevant checks.
 *
 * Usage:
 *   node scripts/verify-push.js             # manual run (diffs HEAD vs upstream)
 *   node scripts/verify-push.js --hook      # called by .githooks/pre-push (reads Git stdin)
 *   node scripts/verify-push.js --all       # force-run every check regardless of diff
 *   node scripts/verify-push.js --fe-only   # force Web FE checks only
 *   node scripts/verify-push.js --admin-only# force Admin checks only
 *   node scripts/verify-push.js --be-only   # force BE checks only
 *   node scripts/verify-push.js --mobile-only # force Mobile checks only
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

// ──────────────────────────────────────────────
// Flags
// ──────────────────────────────────────────────
const args       = process.argv.slice(2);
const isHook     = args.includes('--hook');
const runAll     = args.includes('--all');
const feOnly     = args.includes('--fe-only');
const adminOnly  = args.includes('--admin-only');
const beOnly     = args.includes('--be-only');
const mobileOnly = args.includes('--mobile-only');

const ROOT = path.resolve(__dirname, '..');

// ──────────────────────────────────────────────
// Git helpers
// ──────────────────────────────────────────────
function git(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: ROOT,
    }).trim();
  } catch {
    return '';
  }
}

function diffFiles(base, head) {
  const out = git(`git diff --name-only ${base} ${head}`);
  return out ? out.split('\n').map(f => f.trim()).filter(Boolean) : [];
}

// ──────────────────────────────────────────────
// Read changed files
// ──────────────────────────────────────────────
function getChangedFiles() {
  const Z40 = '0'.repeat(40);

  if (isHook) {
    let stdinData = '';
    try {
      stdinData = require('fs').readFileSync(0, 'utf-8');
    } catch {
      stdinData = '';
    }

    const files = new Set();

    for (const line of stdinData.trim().split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;

      const [, localSha, , remoteSha] = parts;

      if (localSha === Z40) {
        continue;
      }

      let base;
      if (remoteSha === Z40) {
        base =
          git('git merge-base HEAD origin/main') ||
          git('git merge-base HEAD origin/master') ||
          git('git rev-parse HEAD~1') ||
          '';
      } else {
        base = remoteSha;
      }

      if (base) {
        diffFiles(base, localSha).forEach(f => files.add(f));
      }
    }

    if (files.size > 0) {
      return Array.from(files);
    }

    console.warn('⚠️  pre-push stdin yielded no refs; falling back to local diff.');
  }

  const upstream =
    git('git rev-parse --abbrev-ref @{u}') ||
    git('git merge-base HEAD origin/main') ||
    git('git merge-base HEAD origin/master') ||
    'HEAD~1';

  const files = diffFiles(upstream, 'HEAD');

  if (!isHook) {
    const staged   = git('git diff --name-only --cached');
    const unstaged = git('git diff --name-only');
    [staged, unstaged].forEach(out =>
      out.split('\n').forEach(f => { if (f.trim()) files.push(f.trim()); })
    );
  }

  return [...new Set(files)];
}

// ──────────────────────────────────────────────
// Classify files → FE / Admin / BE / Mobile
// ──────────────────────────────────────────────

const FE_PATTERNS = [
  /^apps\/web-app\//,
  /^\.github\/workflows\/frontend-ci\.yml$/,
];

const ADMIN_PATTERNS = [
  /^apps\/admin-app\//,
  /^\.github\/workflows\/admin-ci\.yml$/,
];

const BE_PATTERNS = [
  /^apps\/backend-api\//,
  /^Dockerfile$/,
  /^\.dockerignore$/,
  /^\.github\/workflows\/ci\.yml$/,
];

const MOBILE_PATTERNS = [
  /^apps\/mobile-app\//,
];

const SHARED_PATTERNS = [
  /^\.githooks\//,
  /^pnpm-workspace\.yaml$/,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^\.npmrc$/,
  /^tsconfig\.json$/,
  /^eslint\.config\.mjs$/,
];

function classify(files) {
  const feFiles     = [];
  const adminFiles  = [];
  const beFiles     = [];
  const mobileFiles = [];
  const sharedFiles = [];
  const otherFiles  = [];

  for (const f of files) {
    if (FE_PATTERNS.some(p => p.test(f))) {
      feFiles.push(f);
    } else if (ADMIN_PATTERNS.some(p => p.test(f))) {
      adminFiles.push(f);
    } else if (BE_PATTERNS.some(p => p.test(f))) {
      beFiles.push(f);
    } else if (MOBILE_PATTERNS.some(p => p.test(f))) {
      mobileFiles.push(f);
    } else if (SHARED_PATTERNS.some(p => p.test(f))) {
      sharedFiles.push(f);
    } else {
      otherFiles.push(f);
    }
  }

  const hasFE     = feFiles.length > 0 || sharedFiles.length > 0;
  const hasAdmin  = adminFiles.length > 0 || sharedFiles.length > 0;
  const hasBE     = beFiles.length > 0 || sharedFiles.length > 0;
  const hasMobile = mobileFiles.length > 0;

  return { feFiles, adminFiles, beFiles, mobileFiles, sharedFiles, otherFiles, hasFE, hasAdmin, hasBE, hasMobile };
}

// ──────────────────────────────────────────────
// Runner
// ──────────────────────────────────────────────
function runCheck(name, cmd, args, cwd) {
  const display = [cmd, ...args].join(' ');
  console.log(`\n  ▶  ${name}`);
  console.log(`     $ ${display}${cwd ? `  (in ${cwd})` : ''}`);

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    cwd: cwd ? path.resolve(ROOT, cwd) : ROOT,
  });

  if (result.status !== 0) {
    console.error(`\n  ❌  FAILED: ${name}`);
    process.exit(result.status || 1);
  }

  console.log(`  ✔   PASSED: ${name}`);
}

function printSection(title) {
  const line = '─'.repeat(54);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${title.padEnd(52)}│`);
  console.log(`└${line}┘`);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
printSection('Git Push Verification Gate (pnpm)');

let activeFE, activeAdmin, activeBE, activeMobile;

if (runAll) {
  console.log('\n  ℹ  --all flag: forcing every check.');
  activeFE     = true;
  activeAdmin  = true;
  activeBE     = true;
  activeMobile = true;
} else if (feOnly) {
  console.log('\n  ℹ  --fe-only flag: running Web FE checks only.');
  activeFE = true;
} else if (adminOnly) {
  console.log('\n  ℹ  --admin-only flag: running Admin checks only.');
  activeAdmin = true;
} else if (beOnly) {
  console.log('\n  ℹ  --be-only flag: running BE checks only.');
  activeBE = true;
} else if (mobileOnly) {
  console.log('\n  ℹ  --mobile-only flag: running Mobile checks only.');
  activeMobile = true;
} else {
  const changedFiles = getChangedFiles();
  const { feFiles, adminFiles, beFiles, mobileFiles, sharedFiles, otherFiles, hasFE, hasAdmin, hasBE, hasMobile } = classify(changedFiles);

  console.log(`\n  Changed files (${changedFiles.length} total):`);

  if (feFiles.length)     console.log(`    📦 Web-App       : ${feFiles.slice(0, 5).join(', ')}${feFiles.length > 5 ? ` +${feFiles.length - 5} more` : ''}`);
  if (adminFiles.length)  console.log(`    ⚙️ Admin-App     : ${adminFiles.slice(0, 5).join(', ')}${adminFiles.length > 5 ? ` +${adminFiles.length - 5} more` : ''}`);
  if (beFiles.length)     console.log(`    🔧 Backend-API   : ${beFiles.slice(0, 5).join(', ')}${beFiles.length > 5 ? ` +${beFiles.length - 5} more` : ''}`);
  if (mobileFiles.length) console.log(`    📱 Mobile-App    : ${mobileFiles.slice(0, 5).join(', ')}${mobileFiles.length > 5 ? ` +${mobileFiles.length - 5} more` : ''}`);
  if (sharedFiles.length) console.log(`    🔗 Shared        : ${sharedFiles.slice(0, 5).join(', ')}${sharedFiles.length > 5 ? ` +${sharedFiles.length - 5} more` : ''}`);
  if (otherFiles.length)  console.log(`    📄 Other/docs    : ${otherFiles.slice(0, 5).join(', ')}${otherFiles.length > 5 ? ` +${otherFiles.length - 5} more` : ''}`);

  if (changedFiles.length === 0) {
    console.log('    (no changes detected)');
  }

  console.log(`\n  ➔ Web checks    : ${hasFE ? '✅  YES' : '⬜  NO'}`);
  console.log(`  ➔ Admin checks  : ${hasAdmin ? '✅  YES' : '⬜  NO'}`);
  console.log(`  ➔ BE checks     : ${hasBE ? '✅  YES' : '⬜  NO'}`);
  console.log(`  ➔ Mobile checks : ${hasMobile ? '✅  YES' : '⬜  NO'}`);

  activeFE     = hasFE;
  activeAdmin  = hasAdmin;
  activeBE     = hasBE;
  activeMobile = hasMobile;
}

// ──────────────────────────────────────────────
// Web App checks
// ──────────────────────────────────────────────
if (activeFE) {
  printSection('Web App Checks');
  runCheck(
    'Web: ESLint',
    'pnpm', ['--filter', 'web-app', 'run', 'lint']
  );
  runCheck(
    'Web: TypeScript',
    'pnpm', ['--filter', 'web-app', 'run', 'type-check']
  );
}

// ──────────────────────────────────────────────
// Admin App checks
// ──────────────────────────────────────────────
if (activeAdmin) {
  printSection('Admin App Checks');
  runCheck(
    'Admin: ESLint',
    'pnpm', ['--filter', 'admin-app', 'run', 'lint']
  );
  runCheck(
    'Admin: TypeScript',
    'pnpm', ['--filter', 'admin-app', 'run', 'type-check']
  );
}

// ──────────────────────────────────────────────
// Backend checks
// ──────────────────────────────────────────────
if (activeBE) {
  printSection('Backend Checks');
  runCheck(
    'BE: Prisma Generate',
    'pnpm', ['--filter', 'backend-api', 'run', 'prisma:generate']
  );
  runCheck(
    'BE: ESLint',
    'pnpm', ['--filter', 'backend-api', 'run', 'lint']
  );
  runCheck(
    'BE: TypeScript',
    'pnpm', ['--filter', 'backend-api', 'run', 'typecheck']
  );
  runCheck(
    'BE: Unit tests',
    'pnpm', ['--filter', 'backend-api', 'run', 'test:unit']
  );
}

// ──────────────────────────────────────────────
// Mobile checks
// ──────────────────────────────────────────────
if (activeMobile) {
  printSection('Mobile App Checks');
  runCheck(
    'Mobile: ESLint',
    'pnpm', ['--filter', 'mobile-app', 'run', 'lint']
  );
}

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────
if (!activeFE && !activeAdmin && !activeBE && !activeMobile) {
  printSection('No relevant changes detected');
  console.log('\n  ℹ  No workspace app files were changed. Skipping checks.');
}

printSection('✔  All checks passed!');
console.log();
process.exit(0);
