import { PrismaClient, UserRole, UserStatus, CategoryType, ListingType, ProductType, ListingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AgroMarket Bolivia database...');

  // ─── Categories ───────────────────────────────────────────────
  const categories = [
    // Agricultural Products
    { name: 'Granos y Cereales', nameAy: 'Qurunta', nameQu: 'Sara', slug: 'granos-cereales', type: CategoryType.AGRICULTURAL, sortOrder: 1 },
    { name: 'Oleaginosas', slug: 'oleaginosas', type: CategoryType.AGRICULTURAL, sortOrder: 2 },
    { name: 'Tubérculos', nameQu: 'Papa', slug: 'tuberculos', type: CategoryType.AGRICULTURAL, sortOrder: 3 },
    { name: 'Hortalizas', slug: 'hortalizas', type: CategoryType.AGRICULTURAL, sortOrder: 4 },
    { name: 'Frutas', slug: 'frutas', type: CategoryType.AGRICULTURAL, sortOrder: 5 },
    { name: 'Ganadería', slug: 'ganaderia', type: CategoryType.AGRICULTURAL, sortOrder: 6 },
    // Supplies
    { name: 'Semillas', slug: 'semillas', type: CategoryType.SUPPLY, sortOrder: 1 },
    { name: 'Fertilizantes', slug: 'fertilizantes', type: CategoryType.SUPPLY, sortOrder: 2 },
    { name: 'Agroquímicos', slug: 'agroquimicos', type: CategoryType.SUPPLY, sortOrder: 3 },
    { name: 'Herramientas', slug: 'herramientas', type: CategoryType.SUPPLY, sortOrder: 4 },
    // Machinery
    { name: 'Tractores', slug: 'tractores', type: CategoryType.MACHINERY, sortOrder: 1 },
    { name: 'Cosechadoras', slug: 'cosechadoras', type: CategoryType.MACHINERY, sortOrder: 2 },
    { name: 'Equipos de Riego', slug: 'equipos-riego', type: CategoryType.MACHINERY, sortOrder: 3 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, iconUrl: null },
    });
  }
  console.log(`  ✓ ${categories.length} categories seeded`);

  // ─── Subcategories for Grains ─────────────────────────────────
  const grainsParent = await prisma.category.findUnique({ where: { slug: 'granos-cereales' } });
  if (grainsParent) {
    const subcats = [
      { name: 'Soya', slug: 'soya', type: CategoryType.AGRICULTURAL },
      { name: 'Maíz', nameQu: 'Sara', slug: 'maiz', type: CategoryType.AGRICULTURAL },
      { name: 'Quinua', slug: 'quinua', type: CategoryType.AGRICULTURAL },
      { name: 'Trigo', slug: 'trigo', type: CategoryType.AGRICULTURAL },
      { name: 'Girasol', slug: 'girasol', type: CategoryType.AGRICULTURAL },
      { name: 'Arroz', slug: 'arroz', type: CategoryType.AGRICULTURAL },
    ];
    for (const sub of subcats) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: { ...sub, parentId: grainsParent.id, iconUrl: null },
      });
    }
    console.log(`  ✓ Grain subcategories seeded`);
  }

  // ─── Admin user ───────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '+59100000000' },
    update: {},
    create: {
      phone: '+59100000000',
      email: 'admin@agromarket.bo',
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      language: 'es',
      wallet: { create: { balance: 0 } },
    },
  });
  console.log(`  ✓ Admin user: ${admin.phone}`);

  // ─── Demo producer ────────────────────────────────────────────
  const prodHash = await bcrypt.hash('Demo1234!', 12);
  const producer = await prisma.user.upsert({
    where: { phone: '+59170000001' },
    update: {},
    create: {
      phone: '+59170000001',
      email: 'productor@demo.bo',
      passwordHash: prodHash,
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
      language: 'es',
      wallet: { create: { balance: 5000 } },
      producerProfile: {
        create: {
          fullName: 'Juan Mamani Quispe',
          nationalId: '1234567',
          department: 'Santa Cruz',
          municipality: 'Montero',
          community: 'Comunidad El Palmar',
          totalHectares: 25,
          kycStatus: 'APPROVED',
          kycApprovedAt: new Date(),
          certificationLevel: 'VERIFIED',
          creditScore: 680,
          crops: {
            createMany: {
              data: [
                { cropName: 'Soya', cropType: 'GRAIN', hectares: 15, isPrimary: true },
                { cropName: 'Maíz', cropType: 'GRAIN', hectares: 10 },
              ],
            },
          },
        },
      },
    },
  });
  console.log(`  ✓ Demo producer: ${producer.phone}`);

  // ─── Demo buyer ───────────────────────────────────────────────
  const buyerHash = await bcrypt.hash('Demo1234!', 12);
  const buyer = await prisma.user.upsert({
    where: { phone: '+59170000002' },
    update: {},
    create: {
      phone: '+59170000002',
      email: 'comprador@demo.bo',
      passwordHash: buyerHash,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      language: 'es',
      wallet: { create: { balance: 100000 } },
      buyerProfile: {
        create: {
          companyName: 'AgroIndustrias Bolivia S.A.',
          nit: '123456789',
          nitVerified: true,
          buyerType: 'AGROINDUSTRY',
          department: 'Santa Cruz',
        },
      },
    },
  });
  console.log(`  ✓ Demo buyer: ${buyer.phone}`);

  // ─── Demo listings ────────────────────────────────────────────
  const soyCat = await prisma.category.findUnique({ where: { slug: 'soya' } });
  const quinuaCat = await prisma.category.findUnique({ where: { slug: 'quinua' } });

  if (soyCat && quinuaCat) {
    await prisma.listing.createMany({
      skipDuplicates: true,
      data: [
        {
          sellerId: producer.id,
          categoryId: soyCat.id,
          title: 'Soya convencional - Cosecha 2025 - 500 qq disponibles',
          description: 'Soya de primera calidad, cosechada en junio 2025. Humedad 12%, proteína 36%. Disponible en planta Montero.',
          listingType: ListingType.SELL,
          productType: ProductType.AGRICULTURAL_PRODUCT,
          quantity: 500,
          unit: 'qq',
          pricePerUnit: 45.50,
          currency: 'BOB',
          minOrder: 10,
          locationDept: 'Santa Cruz',
          locationMuni: 'Montero',
          latitude: -17.3333,
          longitude: -63.25,
          isNegotiable: true,
          isOrganic: false,
          status: ListingStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        {
          sellerId: producer.id,
          categoryId: quinuaCat.id,
          title: 'Quinua Real Orgánica - Certificada SENASAG - 100 qq',
          description: 'Quinua Real del altiplano boliviano, certificada orgánica. Excelente para exportación a Europa. Calidad Premium.',
          listingType: ListingType.SELL,
          productType: ProductType.AGRICULTURAL_PRODUCT,
          quantity: 100,
          unit: 'qq',
          pricePerUnit: 280,
          currency: 'BOB',
          minOrder: 5,
          locationDept: 'Oruro',
          locationMuni: 'Challapata',
          isNegotiable: true,
          isOrganic: true,
          hasCertification: true,
          certificationType: 'ORGANIC',
          status: ListingStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    console.log(`  ✓ Demo listings created`);
  }

  // ─── Sample price history ─────────────────────────────────────
  if (soyCat) {
    const depts = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Beni'];
    for (const dept of depts) {
      const base = 44 + Math.random() * 4;
      for (let i = 30; i >= 0; i--) {
        await prisma.priceHistory.create({
          data: {
            categoryId: soyCat.id,
            productName: 'Soya',
            department: dept,
            avgPrice: base + (Math.random() - 0.5) * 3,
            minPrice: base - 2,
            maxPrice: base + 3,
            unit: 'qq',
            sampleCount: Math.floor(Math.random() * 20) + 5,
            recordedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log(`  ✓ Price history seeded`);
  }

  console.log('\n🌾 Seed complete! Demo credentials:');
  console.log('  Admin:    +59100000000 / Admin1234!');
  console.log('  Producer: +59170000001 / Demo1234!');
  console.log('  Buyer:    +59170000002 / Demo1234!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
