import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole, VipPlanStatus } from '@prisma/client';

const connectionString = requireEnv('DATABASE_URL');
const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

const vipPlans = [
  {
    name: '连续包月',
    description: '',
    level: 1,
    durationMonths: 1,
    price: '18.80',
    productCode: 'com.lyl.byyourside.vip.month.1',
    status: VipPlanStatus.ACTIVE,
  },
  {
    name: '连续包季',
    description: '',
    level: 1,
    durationMonths: 3,
    price: '46.00',
    productCode: 'com.lyl.byyourside.vip.month.3',
    status: VipPlanStatus.ACTIVE,
  },
  {
    name: '连续半年',
    description: '',
    level: 1,
    durationMonths: 6,
    price: '84.00',
    productCode: 'com.lyl.byyourside.vip.month.6',
    status: VipPlanStatus.ACTIVE,
  },
  {
    name: '连续包年',
    description: '',
    level: 1,
    durationMonths: 12,
    price: '158.00',
    productCode: 'com.lyl.byyourside.vip.month.12',
    status: VipPlanStatus.ACTIVE,
  },
  {
    name: '连续包年',
    description: '免费体验三天',
    level: 1,
    durationMonths: 13,
    price: '158.00',
    productCode: 'com.lyl.byyourside.vip.month.12.3dfree',
    status: VipPlanStatus.ACTIVE,
  },
  {
    name: '双人包月',
    description: '',
    level: 1,
    durationMonths: 1,
    price: '28.80',
    productCode: 'com.lyl.byyourside.vip.month.duet.1',
    status: VipPlanStatus.DUET,
  },
  {
    name: '双人包季',
    description: '',
    level: 1,
    durationMonths: 3,
    price: '69.00',
    productCode: 'com.lyl.byyourside.vip.month.duet.3',
    status: VipPlanStatus.DUET,
  },
  {
    name: '双人半年',
    description: '',
    level: 1,
    durationMonths: 6,
    price: '128.00',
    productCode: 'com.lyl.byyourside.vip.month.duet.6',
    status: VipPlanStatus.DUET,
  },
  {
    name: '双人包年',
    description: '巨划算',
    level: 1,
    durationMonths: 12,
    price: '239.00',
    productCode: 'com.lyl.byyourside.vip.month.duet.12',
    status: VipPlanStatus.DUET,
  },
  {
    name: '双人包年',
    description: '免费体验三天',
    level: 1,
    durationMonths: 13,
    price: '239.00',
    productCode: 'com.lyl.byyourside.vip.month.duet.12.3dfree',
    status: VipPlanStatus.DUET,
  },
] as const;

async function main(): Promise<void> {
  const adminUsername = requireEnv('ADMIN_USERNAME');
  const adminEmail = requireEnv('ADMIN_EMAIL');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const appEnvironment = requireEnv('APP_ENVIRONMENT');
  const appName = requireEnv('APP_NAME');
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      nickname: '管理员',
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      nickname: '管理员',
    },
  });

  await prisma.appConfig.upsert({
    where: {
      environment: appEnvironment,
    },
    update: {
      appName,
      unCheckMode: process.env.APP_UNCHECK_MODE === 'true',
    },
    create: {
      environment: appEnvironment,
      appName,
      unCheckMode: process.env.APP_UNCHECK_MODE === 'true',
    },
  });

  for (const plan of vipPlans) {
    await prisma.vipPlan.upsert({
      where: { productCode: plan.productCode },
      update: plan,
      create: plan,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('种子数据初始化失败。', error);
    await prisma.$disconnect();
    process.exit(1);
  });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} 未配置，无法执行 seed`);
  }
  if (
    /^<|example\.com|ChangeMe_|replace-with|byyouside_password/i.test(value)
  ) {
    throw new Error(`${name} 仍是示例值，无法执行 seed`);
  }
  return value;
}
