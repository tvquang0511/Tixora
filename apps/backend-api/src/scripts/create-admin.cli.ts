import * as readline from 'readline';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Load .env from root or local dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend-api/.env') });

const prisma = new PrismaClient();

const ALL_ROLES = [
  { name: 'SuperAdmin', description: 'Root system administrator' },
  { name: 'Admin', description: 'System administrator' },
  { name: 'Organizer', description: 'Concert organizer' },
  { name: 'Checker', description: 'Gate staff' },
  { name: 'Audience', description: 'Regular customer' },
];

const ALL_PERMISSIONS = [
  { code: 'CREATE_CONCERT', description: 'Create concerts' },
  { code: 'UPDATE_CONCERT', description: 'Update concerts' },
  { code: 'DELETE_CONCERT', description: 'Delete concerts' },
  { code: 'VIEW_REVENUE', description: 'View revenue reports' },
  { code: 'SCAN_TICKET', description: 'Scan tickets at gate' },
  { code: 'MANAGE_USERS', description: 'Manage staff accounts and roles' },
  { code: 'MANAGE_ADMINS', description: 'Manage administrator accounts and privilege levels' },
  { code: 'ASSIGN_CHECKER', description: 'Assign checkers to concert gates' },
  { code: 'IMPORT_GUESTS', description: 'Import VIP and guest lists' },
];

const SUPER_ADMIN_PERMISSIONS = [
  'CREATE_CONCERT',
  'UPDATE_CONCERT',
  'DELETE_CONCERT',
  'VIEW_REVENUE',
  'SCAN_TICKET',
  'MANAGE_USERS',
  'MANAGE_ADMINS',
  'ASSIGN_CHECKER',
  'IMPORT_GUESTS',
];

const ADMIN_PERMISSIONS = [
  'CREATE_CONCERT',
  'UPDATE_CONCERT',
  'DELETE_CONCERT',
  'VIEW_REVENUE',
  'SCAN_TICKET',
  'MANAGE_USERS',
  'ASSIGN_CHECKER',
  'IMPORT_GUESTS',
];

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return undefined;
}

function prompt(query: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const displayQuery = defaultValue ? `${query} (${defaultValue}): ` : `${query}: `;
    rl.question(displayQuery, (ans) => {
      rl.close();
      const val = ans.trim();
      resolve(val ? val : (defaultValue || ''));
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('        Tixora - Super Admin Bootstrap CLI          ');
  console.log('====================================================\n');

  let email = getArg('--email');
  let password = getArg('--password');
  let fullName = getArg('--name');

  // If running interactively without flags and stdin is a TTY
  if (!email && process.stdin.isTTY) {
    email = await prompt('Enter Super Admin Email', 'superadmin@tixora.local');
  } else if (!email) {
    email = 'superadmin@tixora.local';
  }

  if (!password && process.stdin.isTTY) {
    password = await prompt('Enter Super Admin Password', 'SuperAdmin123!');
  } else if (!password) {
    password = 'SuperAdmin123!';
  }

  if (!fullName && process.stdin.isTTY) {
    fullName = await prompt('Enter Full Name', 'Super Administrator');
  } else if (!fullName) {
    fullName = 'Super Administrator';
  }

  if (!email || !password || !fullName) {
    console.error('Error: Email, password, and full name are required.');
    process.exit(1);
  }

  console.log(`\nProvisioning Super Admin account for: ${email}`);

  // 1. Ensure Roles & Permissions exist
  console.log('1. Verifying and synchronizing system roles & permissions...');
  await prisma.role.createMany({ data: ALL_ROLES, skipDuplicates: true });
  await prisma.permission.createMany({ data: ALL_PERMISSIONS, skipDuplicates: true });

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SuperAdmin' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });

  if (!superAdminRole || !adminRole) {
    throw new Error('Could not find or create SuperAdmin / Admin roles');
  }

  // Map permissions to SuperAdmin
  const superAdminPerms = await prisma.permission.findMany({
    where: { code: { in: SUPER_ADMIN_PERMISSIONS } },
  });
  for (const perm of superAdminPerms) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: superAdminRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: superAdminRole.id,
        permission_id: perm.id,
      },
    });
  }

  // Map permissions to Admin
  const adminPerms = await prisma.permission.findMany({
    where: { code: { in: ADMIN_PERMISSIONS } },
  });
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: perm.id,
      },
    });
  }

  // 2. Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // 3. Upsert User
  console.log('2. Provisioning Super Admin user record...');
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash: passwordHash,
      status: 'ACTIVE',
      full_name: fullName,
    },
    create: {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      status: 'ACTIVE',
    },
  });

  // 4. Assign SuperAdmin Role
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: superAdminRole.id,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: superAdminRole.id,
    },
  });

  console.log('\n====================================================');
  console.log(' [SUCCESS] Super Admin account created / upgraded!');
  console.log('----------------------------------------------------');
  console.log(` User ID   : ${user.id}`);
  console.log(` Email     : ${user.email}`);
  console.log(` Password  : ${password}`);
  console.log(` Role      : SuperAdmin (All 9 Permissions + MANAGE_ADMINS)`);
  console.log(` Status    : ACTIVE`);
  console.log('====================================================\n');
}

main()
  .catch((err) => {
    console.error('\n[ERROR] Failed to bootstrap admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
