import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const args = process.argv.slice(2);

function getArg(name) {
  const withEquals = args.find((arg) => arg.startsWith(`--${name}=`));
  if (withEquals) {
    return withEquals.slice(name.length + 3);
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }

  return undefined;
}

function hasArg(name) {
  return args.includes(`--${name}`);
}

function printUsage() {
  console.log('Usage:');
  console.log('node scripts/add-admin.mjs --email <email> --password <password> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --firstName   First name (default: Admin)');
  console.log('  --lastName    Last name (default: User)');
  console.log('  --role        User role (default: admin)');
  console.log('  --update      Update password if user already exists');
  console.log('  --claim       Force claiming unassigned bookmarks to the target user');
  console.log('  --no-claim    Skip bookmark ownership claim step');
}

function toNumber(value) {
  return Number(value ?? 0);
}

async function claimUnassignedBookmarks(client, userId) {
  try {
    const orphaned = await client.execute({
      sql: 'SELECT COUNT(*) AS count FROM bookmarks WHERE user_id IS NULL OR TRIM(user_id) = \'\'',
    });

    const orphanedCount = toNumber(orphaned.rows[0]?.count);
    if (orphanedCount === 0) {
      console.log('No unassigned bookmarks found to claim.');
      return;
    }

    await client.execute({
      sql: 'UPDATE bookmarks SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = \'\'',
      args: [userId],
    });

    console.log(`Claimed ${orphanedCount} unassigned bookmarks to user ${userId}.`);
  } catch (error) {
    if (String(error).includes('no such table: bookmarks')) {
      console.log('Bookmarks table not found; skipping claim step.');
      return;
    }

    throw error;
  }
}

async function createAdminUser() {
  const email = getArg('email') || process.env.ADMIN_EMAIL;
  const password = getArg('password') || process.env.ADMIN_PASSWORD;
  const firstName = getArg('firstName') || process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = getArg('lastName') || process.env.ADMIN_LAST_NAME || 'User';
  const role = getArg('role') || 'admin';
  const shouldUpdate = hasArg('update');

  if (!email || !password) {
    printUsage();
    throw new Error('Email and password are required.');
  }

  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;
  if (!dbUrl || !dbToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env(.local).');
  }

  const client = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        app_id text NOT NULL DEFAULT 'local',
        created_at text DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email)');

    const usersBefore = await client.execute({
      sql: 'SELECT id, email FROM users',
    });
    const hasSingleExistingUser = usersBefore.rows.length === 1;
    const shouldClaim = hasArg('claim') || !hasArg('no-claim');
    const shouldRunClaim = shouldClaim && (hasSingleExistingUser || hasArg('claim'));

    const existing = await client.execute({
      sql: 'SELECT id, role FROM users WHERE email = ?',
      args: [email],
    });

    const passwordHash = await bcrypt.hash(password, 12);

    if (existing.rows.length > 0) {
      const existingUserId = existing.rows[0].id;

      if (!shouldUpdate) {
        console.log(`User ${email} already exists. Re-run with --update to reset the password.`);
        return;
      }

      await client.execute({
        sql: 'UPDATE users SET password_hash = ?, first_name = ?, last_name = ?, role = ? WHERE email = ?',
        args: [passwordHash, firstName, lastName, role, email],
      });

      if (shouldRunClaim) {
        const claimUserId = hasSingleExistingUser ? usersBefore.rows[0]?.id : existingUserId;
        await claimUnassignedBookmarks(client, claimUserId);
      }

      console.log(`Updated existing user ${email} and set role to ${role}.`);
      return;
    }

    const appId = process.env.AUTH_APP_ID || process.env.APP_ID || 'local';
    const newUserId = randomUUID();

    await client.execute({
      sql: `INSERT INTO users (id, email, password_hash, first_name, last_name, role, app_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [newUserId, email, passwordHash, firstName, lastName, role, appId],
    });

    if (shouldRunClaim && !hasSingleExistingUser) {
      await claimUnassignedBookmarks(client, newUserId);
    }
    if (shouldRunClaim && hasSingleExistingUser) {
      await claimUnassignedBookmarks(client, usersBefore.rows[0]?.id);
    }

    console.log(`Created user ${email} with role ${role}.`);
  } finally {
    client.close();
  }
}

createAdminUser().catch((error) => {
  console.error('Failed to create admin user:', error.message);
  process.exitCode = 1;
});
