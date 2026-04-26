/**
 * Seed RBAC: Default Roles & Permissions
 * Run: cd /home/z/my-project && bun run scripts/seed-rbac.ts
 */
import { db } from '../src/lib/db';

/* ------------------------------------------------------------------ */
/*  Default Roles                                                      */
/* ------------------------------------------------------------------ */
const defaultRoles = [
  { name: 'super_admin',     label: 'مدیر ارشد',         description: 'دسترسی کامل به تمام بخش‌ها',          color: '#D4AF37', priority: 100, isSystem: true },
  { name: 'admin',           label: 'مدیر سیستم',         description: 'دسترسی به بخش مدیریت سیستم',          color: '#F59E0B', priority: 80,  isSystem: true },
  { name: 'support_admin',   label: 'مدیر پشتیبانی',      description: 'مدیریت تیکت‌ها و پشتیبانی',            color: '#3B82F6', priority: 60,  isSystem: true },
  { name: 'finance_admin',   label: 'مدیر مالی',          description: 'مدیریت تراکنش‌ها و پرداخت‌ها',         color: '#10B981', priority: 60,  isSystem: true },
  { name: 'support_agent',   label: 'اپراتور پشتیبانی',   description: 'پاسخگویی به تیکت‌ها',                  color: '#8B5CF6', priority: 40,  isSystem: true },
  { name: 'viewer',          label: 'بازدیدکننده',        description: 'فقط مشاهده اطلاعات',                  color: '#6B7280', priority: 10,  isSystem: true },
  { name: 'user',            label: 'کاربر عادی',         description: 'دسترسی کاربر عادی',                    color: '#6B7280', priority: 0,   isSystem: true },
];

/* ------------------------------------------------------------------ */
/*  Default Permissions by Module                                       */
/* ------------------------------------------------------------------ */
const modulePermissions: Record<string, { name: string; label: string; description: string }[]> = {
  users: [
    { name: 'users.view',     label: 'مشاهده کاربران',       description: 'مشاهده لیست و جزئیات کاربران' },
    { name: 'users.create',   label: 'ایجاد کاربر',         description: 'ایجاد کاربر جدید' },
    { name: 'users.edit',     label: 'ویرایش کاربر',        description: 'ویرایش اطلاعات کاربر' },
    { name: 'users.delete',   label: 'حذف کاربر',          description: 'حذف کاربر' },
    { name: 'users.freeze',   label: 'مسدود‌سازی حساب',    description: 'یخ‌زدن یا رفع یخ‌زدگی حساب' },
    { name: 'users.verify',   label: 'احراز هویت',         description: 'تایید یا رد احراز هویت' },
    { name: 'users.roles',    label: 'مدیریت نقش‌ها',       description: 'تخصیص و تغییر نقش کاربران' },
  ],
  tickets: [
    { name: 'tickets.view',   label: 'مشاهده تیکت‌ها',      description: 'مشاهده لیست و جزئیات تیکت‌ها' },
    { name: 'tickets.create', label: 'ایجاد تیکت',         description: 'ایجاد تیکت جدید' },
    { name: 'tickets.reply',  label: 'پاسخ به تیکت',       description: 'ارسال پاسخ به تیکت' },
    { name: 'tickets.delete', label: 'حذف تیکت',          description: 'حذف تیکت' },
    { name: 'tickets.assign', label: 'اختصاص تیکت',        description: 'اختصاص تیکت به اپراتور' },
    { name: 'tickets.close',  label: 'بستن تیکت',         description: 'بستن تیکت' },
    { name: 'tickets.bulk',   label: 'عملیات گروهی تیکت',  description: 'عملیات گروهی روی تیکت‌ها' },
  ],
  transactions: [
    { name: 'transactions.view',   label: 'مشاهده تراکنش‌ها',    description: 'مشاهده لیست و جزئیات تراکنش‌ها' },
    { name: 'transactions.refund', label: 'بازپرداخت',          description: 'انجام بازپرداخت' },
    { name: 'transactions.export', label: 'خروجی تراکنش‌ها',    description: 'دانلود خروجی تراکنش‌ها' },
  ],
  payments: [
    { name: 'payments.view',         label: 'مشاهده پرداخت‌ها',       description: 'مشاهده لیست پرداخت‌ها' },
    { name: 'payments.verify',       label: 'تایید پرداخت',          description: 'تایید پرداخت‌ها' },
    { name: 'payments.refund',       label: 'بازپرداخت پرداخت',      description: 'انجام بازپرداخت پرداخت' },
    { name: 'payments.settlements',  label: 'تسویه‌حساب',            description: 'مدیریت تسویه‌حساب' },
  ],
  wallets: [
    { name: 'wallets.view',    label: 'مشاهده کیف پول',       description: 'مشاهده موجودی کیف پول' },
    { name: 'wallets.adjust',  label: 'تعدیل کیف پول',       description: 'تعدیل موجودی کیف پول' },
    { name: 'wallets.freeze',  label: 'مسدود‌سازی کیف پول', description: 'مسدود کردن کیف پول' },
  ],
  kyc: [
    { name: 'kyc.view',    label: 'مشاهده درخواست‌ها',    description: 'مشاهده درخواست‌های احراز هویت' },
    { name: 'kyc.approve', label: 'تایید احراز هویت',     description: 'تایید درخواست احراز هویت' },
    { name: 'kyc.reject',  label: 'رد احراز هویت',       description: 'رد درخواست احراز هویت' },
  ],
  blog: [
    { name: 'blog.view',    label: 'مشاهده بلاگ',          description: 'مشاهده مطالب بلاگ' },
    { name: 'blog.create',  label: 'ایجاد مطلب',           description: 'ایجاد مطلب جدید' },
    { name: 'blog.edit',    label: 'ویرایش مطلب',          description: 'ویرایش مطالب' },
    { name: 'blog.delete',  label: 'حذف مطلب',            description: 'حذف مطالب' },
    { name: 'blog.publish', label: 'انتشار مطلب',          description: 'انتشار یا لغو انتشار مطلب' },
  ],
  settings: [
    { name: 'settings.view',   label: 'مشاهده تنظیمات',      description: 'مشاهده تنظیمات سیستم' },
    { name: 'settings.edit',   label: 'ویرایش تنظیمات',     description: 'ویرایش تنظیمات سیستم' },
    { name: 'settings.system', label: 'تنظیمات سیستمی',     description: 'تنظیمات حساس سیستم' },
  ],
  security: [
    { name: 'security.view',   label: 'مشاهده امنیت',       description: 'مشاهده گزارشات امنیتی' },
    { name: 'security.events', label: 'رویدادهای امنیتی',   description: 'مشاهده و مدیریت رویدادهای امنیتی' },
    { name: 'security.blocks', label: 'مسدودسازی IP',       description: 'مسدود یا رفع مسدودسازی IP' },
    { name: 'security.config', label: 'تنظیمات امنیت',      description: 'پیکربندی تنظیمات امنیتی' },
  ],
  reports: [
    { name: 'reports.view',      label: 'مشاهده گزارشات',       description: 'مشاهده گزارشات' },
    { name: 'reports.export',    label: 'خروجی گزارشات',        description: 'دانلود خروجی گزارشات' },
    { name: 'reports.analytics', label: 'تحلیل داده‌ها',        description: 'دسترسی به ابزارهای تحلیلی' },
  ],
  marketing: [
    { name: 'marketing.view',     label: 'مشاهده مارکتینگ',       description: 'مشاهده کمپین‌های مارکتینگ' },
    { name: 'marketing.sms',      label: 'پیامک',                 description: 'مدیریت پیامک‌ها' },
    { name: 'marketing.email',    label: 'ایمیل',                 description: 'مدیریت ایمیل‌ها' },
    { name: 'marketing.telegram', label: 'تلگرام',               description: 'مدیریت ربات تلگرام' },
  ],
  roles: [
    { name: 'roles.view',   label: 'مشاهده نقش‌ها',      description: 'مشاهده لیست نقش‌ها' },
    { name: 'roles.create', label: 'ایجاد نقش',         description: 'ایجاد نقش جدید' },
    { name: 'roles.edit',   label: 'ویرایش نقش',        description: 'ویرایش نقش' },
    { name: 'roles.delete', label: 'حذف نقش',          description: 'حذف نقش' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Default Role-Permission Mapping                                     */
/* ------------------------------------------------------------------ */
const rolePermissionMap: Record<string, string[]> = {
  super_admin: ['*'], // All permissions
  admin: [
    'users.view', 'users.create', 'users.edit', 'users.freeze', 'users.verify', 'users.roles',
    'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.delete', 'tickets.assign', 'tickets.close', 'tickets.bulk',
    'transactions.view', 'transactions.refund', 'transactions.export',
    'payments.view', 'payments.verify', 'payments.refund', 'payments.settlements',
    'wallets.view', 'wallets.adjust', 'wallets.freeze',
    'kyc.view', 'kyc.approve', 'kyc.reject',
    'blog.view', 'blog.create', 'blog.edit', 'blog.delete', 'blog.publish',
    'settings.view', 'settings.edit',
    'security.view', 'security.events', 'security.blocks', 'security.config',
    'reports.view', 'reports.export', 'reports.analytics',
    'marketing.view', 'marketing.sms', 'marketing.email', 'marketing.telegram',
    'roles.view', 'roles.create', 'roles.edit',
  ],
  support_admin: [
    'users.view', 'users.edit', 'users.verify',
    'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.close', 'tickets.bulk',
    'kyc.view', 'kyc.approve', 'kyc.reject',
    'reports.view', 'reports.export',
    'marketing.view',
    'roles.view',
  ],
  finance_admin: [
    'users.view', 'users.verify',
    'transactions.view', 'transactions.refund', 'transactions.export',
    'payments.view', 'payments.verify', 'payments.refund', 'payments.settlements',
    'wallets.view', 'wallets.adjust', 'wallets.freeze',
    'reports.view', 'reports.export', 'reports.analytics',
    'roles.view',
  ],
  support_agent: [
    'users.view',
    'tickets.view', 'tickets.reply', 'tickets.close',
    'kyc.view',
    'roles.view',
  ],
  viewer: [
    'users.view',
    'tickets.view',
    'transactions.view',
    'payments.view',
    'wallets.view',
    'kyc.view',
    'blog.view',
    'settings.view',
    'security.view',
    'reports.view',
    'marketing.view',
    'roles.view',
  ],
  user: [],
};

/* ------------------------------------------------------------------ */
/*  Main seed function                                                  */
/* ------------------------------------------------------------------ */
async function seed() {
  console.log('🚀 Seeding RBAC system...\n');

  // 1. Seed roles
  console.log('📦 Seeding roles...');
  const createdRoles: Record<string, string> = {};
  for (const role of defaultRoles) {
    const existing = await db.role.findUnique({ where: { name: role.name } });
    if (!existing) {
      const created = await db.role.create({ data: role });
      createdRoles[role.name] = created.id;
      console.log(`  ✅ Created role: ${role.label} (${role.name})`);
    } else {
      // Update if system fields changed
      await db.role.update({
        where: { name: role.name },
        data: { label: role.label, description: role.description, color: role.color, priority: role.priority, isSystem: role.isSystem },
      });
      createdRoles[role.name] = existing.id;
      console.log(`  ⏭️  Updated role: ${role.label} (${role.name})`);
    }
  }

  // 2. Seed permissions
  console.log('\n📦 Seeding permissions...');
  const allPermissionNames: string[] = [];
  for (const [module, perms] of Object.entries(modulePermissions)) {
    for (const perm of perms) {
      allPermissionNames.push(perm.name);
      const existing = await db.permission.findUnique({ where: { name: perm.name } });
      if (!existing) {
        await db.permission.create({ data: { ...perm, module } });
        console.log(`  ✅ Created permission: ${perm.label} (${perm.name})`);
      } else {
        await db.permission.update({
          where: { name: perm.name },
          data: { label: perm.label, module, description: perm.description },
        });
      }
    }
  }

  // 3. Seed role-permission mappings
  console.log('\n📦 Seeding role-permission mappings...');
  for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
    const roleId = createdRoles[roleName];
    if (!roleId) continue;

    // Delete existing mappings for this role
    await db.rolePermission.deleteMany({ where: { roleId } });

    if (permNames.includes('*')) {
      // Grant all permissions
      const allPerms = await db.permission.findMany({ select: { id: true } });
      for (const perm of allPerms) {
        await db.rolePermission.create({
          data: { roleId, permissionId: perm.id },
        });
      }
      console.log(`  ✅ ${roleName}: granted ALL ${allPerms.length} permissions`);
    } else {
      for (const permName of permNames) {
        const perm = await db.permission.findUnique({ where: { name: permName } });
        if (perm) {
          await db.rolePermission.create({
            data: { roleId, permissionId: perm.id },
          });
        }
      }
      console.log(`  ✅ ${roleName}: granted ${permNames.length} permissions`);
    }
  }

  console.log('\n✨ RBAC seeding completed successfully!');
  console.log(`   Roles: ${defaultRoles.length}`);
  console.log(`   Permissions: ${allPermissionNames.length}`);
  console.log(`   Modules: ${Object.keys(modulePermissions).length}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
