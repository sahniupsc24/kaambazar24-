import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { PlatformSetting } from '../entities/PlatformSetting';
import { UserRole, PlanAudience, PlanType } from '../entities/enums';
import { hashPassword } from '../utils/password';

/**
 * Run once after the first migration, before anyone logs in as admin:
 *   npm run seed
 *
 * Safe to re-run — it skips anything that already exists.
 */
async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  // --- SUPER_ADMIN account (upsert — also reset password each seed run for testing) ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';

  // Find admin by email or username (to handle partial previous seeds)
  let existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    existingAdmin = await userRepo.findOne({ where: { username: adminUsername } as any });
  }

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    const adminUser = userRepo.create({
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    await userRepo.save(adminUser);
    // eslint-disable-next-line no-console
    console.log(`✅ Created SUPER_ADMIN: email="${adminEmail}" password="${adminPassword}"`);
  } else {
    // Reset password & ensure active using direct update (no save to avoid key conflicts)
    const passwordHash = await hashPassword(adminPassword);
    await userRepo.update({ id: existingAdmin.id }, { email: adminEmail, passwordHash, isActive: true });
    // eslint-disable-next-line no-console
    console.log(`✅ Reset SUPER_ADMIN password: email="${existingAdmin.email}" password="${adminPassword}"`);
  }


  // --- Demo WORKER account ---
  const workerEmail = 'w1@example.com';
  const workerPassword = 'Worker123!';
  const existingWorker = await userRepo.findOne({ where: { email: workerEmail } });
  if (!existingWorker) {
    const passwordHash = await hashPassword(workerPassword);
    const workerUser = userRepo.create({
      email: workerEmail,
      username: 'worker1',
      passwordHash,
      role: UserRole.WORKER,
      isActive: true,
    });
    await userRepo.save(workerUser);

    // Create worker profile
    const workerRepo = AppDataSource.getRepository(WorkerProfile);
    await workerRepo.save(
      workerRepo.create({ userId: workerUser.id, fullName: 'Ramesh Kumar (Worker)' })
    );
    // eslint-disable-next-line no-console
    console.log(`✅ Created WORKER: email="${workerEmail}" password="${workerPassword}"`);
  } else {
    // Reset password using update — avoids duplicate key conflict
    const passwordHash = await hashPassword(workerPassword);
    await userRepo.update({ id: existingWorker.id }, { passwordHash, isActive: true });
    // eslint-disable-next-line no-console
    console.log(`✅ Reset WORKER password: email="${workerEmail}" password="${workerPassword}"`);
  }

  // --- Demo EMPLOYER account ---
  const employerEmail = 'e1@example.com';
  const employerPassword = 'Employer123!';
  const existingEmployer = await userRepo.findOne({ where: { email: employerEmail } });
  if (!existingEmployer) {
    const passwordHash = await hashPassword(employerPassword);
    const employerUser = userRepo.create({
      email: employerEmail,
      username: 'demo_employer1',
      passwordHash,
      role: UserRole.EMPLOYER,
      isActive: true,
    });
    await userRepo.save(employerUser);

    // Create employer profile
    const employerRepo = AppDataSource.getRepository(EmployerProfile);
    await employerRepo.save(
      employerRepo.create({ userId: employerUser.id, businessName: 'Demo Constructions Pvt Ltd' })
    );
    // eslint-disable-next-line no-console
    console.log(`✅ Created EMPLOYER: email="${employerEmail}" password="${employerPassword}"`);
  } else {
    // Reset password using update — avoids duplicate key conflict
    const passwordHash = await hashPassword(employerPassword);
    await userRepo.update({ id: existingEmployer.id }, { passwordHash, isActive: true });
    // eslint-disable-next-line no-console
    console.log(`✅ Reset EMPLOYER password: email="${employerEmail}" password="${employerPassword}"`);
  }

  // --- Default subscription plans (worker + buyer) ---
  const planRepo = AppDataSource.getRepository(SubscriptionPlan);
  const existingPlans = await planRepo.count();
  if (existingPlans === 0) {
    await planRepo.save([
      planRepo.create({ audience: PlanAudience.WORKER, name: 'Single Contact', type: PlanType.ONE_TIME, price: '49', contactsIncluded: 1 }),
      planRepo.create({ audience: PlanAudience.WORKER, name: '5 Contacts Pack', type: PlanType.ONE_TIME, price: '199', contactsIncluded: 5 }),
      planRepo.create({ audience: PlanAudience.WORKER, name: 'Monthly Unlimited', type: PlanType.SUBSCRIPTION, price: '299', durationDays: 30 }),
      planRepo.create({ audience: PlanAudience.EMPLOYER, name: 'Single Contact', type: PlanType.ONE_TIME, price: '99', contactsIncluded: 1 }),
      planRepo.create({ audience: PlanAudience.EMPLOYER, name: '10 Contacts Pack', type: PlanType.ONE_TIME, price: '499', contactsIncluded: 10 }),
      planRepo.create({ audience: PlanAudience.EMPLOYER, name: 'Monthly Unlimited', type: PlanType.SUBSCRIPTION, price: '999', durationDays: 30 }),
    ]);
    // eslint-disable-next-line no-console
    console.log('✅ Seeded default subscription plans.');
  } else {
    // eslint-disable-next-line no-console
    console.log('Plans already exist, skipping.');
  }

  // --- Default platform settings ---
  const settingRepo = AppDataSource.getRepository(PlatformSetting);
  const existingSetting = await settingRepo.findOne({ where: { key: 'FEATURED_LISTING_PRICE' } });
  if (!existingSetting) {
    await settingRepo.save([
      settingRepo.create({ key: 'FEATURED_LISTING_PRICE', value: '149' }),
      settingRepo.create({ key: 'FEATURED_LISTING_DAYS', value: '7' }),
    ]);
    // eslint-disable-next-line no-console
    console.log('✅ Seeded default platform settings.');
  }

  // --- Categories seeding (25+ Blue-Collar Categories) ---
  const { Category } = await import('../entities/Category');
  const categoryRepo = AppDataSource.getRepository(Category);
  const categoriesData = [
    { name: 'Construction & Building (निर्माण)', slug: 'construction-building', description: 'Masons, helpers, bricklayers, plasterers' },
    { name: 'Plumbing (प्लंबिंग)', slug: 'plumbing', description: 'Pipe fitting, tap repair, drainage, bathroom installation' },
    { name: 'Electrical Work (इलेक्ट्रिकल)', slug: 'electrical-work', description: 'Wiring, appliance repair, fuse fix, light installation' },
    { name: 'Painting & Decorating (पेंटिंग)', slug: 'painting-decorating', description: 'House painting, texture, waterproofing, polish' },
    { name: 'Carpentry & Woodwork (बढ़ईगीरी)', slug: 'carpentry-woodwork', description: 'Furniture repair, door/window making, modular kitchen' },
    { name: 'Welding & Fabrication (वेल्डिंग)', slug: 'welding-fabrication', description: 'Grill work, gate fabrication, iron structure welding' },
    { name: 'Domestic Help / Maid (घरेलू सहायक)', slug: 'domestic-help-maid', description: 'House cleaning, vessel washing, clothes washing' },
    { name: 'Cooking / Chef (रसोइया)', slug: 'cooking-chef', description: 'Home cook, party cook, tiffin service, hotel cook' },
    { name: 'Driving - Car/Truck/Auto (ड्राइवर)', slug: 'driving', description: 'Personal driver, commercial driver, delivery driver' },
    { name: 'Security Guard (सिक्योरिटी गार्ड)', slug: 'security-guard', description: 'Building security, event security, ATM guard' },
    { name: 'Warehouse / Loading (गोदाम / लोडिंग)', slug: 'warehouse-loading', description: 'Goods loading, unloading, packing, sorting' },
    { name: 'Cleaning & Housekeeping (सफाई)', slug: 'cleaning-housekeeping', description: 'Office cleaning, deep cleaning, sanitation worker' },
    { name: 'Gardening & Landscaping (बागवानी)', slug: 'gardening', description: 'Lawn maintenance, plant trimming, garden setup' },
    { name: 'Tailoring & Sewing (दर्जी)', slug: 'tailoring-sewing', description: 'Stitching, alteration, boutique work, garment worker' },
    { name: 'AC / Refrigeration Repair (एसी रिपेयर)', slug: 'ac-refrigeration-repair', description: 'AC servicing, gas refilling, fridge repair' },
    { name: 'Mobile & Computer Repair (मोबाइल रिपेयर)', slug: 'mobile-repair', description: 'Hardware fix, screen replacement, software fix' },
    { name: 'Delivery & Courier (डिलीवरी)', slug: 'delivery-courier', description: 'Food delivery, parcel delivery, grocery delivery' },
    { name: 'Factory Worker (फैक्ट्री वर्कर)', slug: 'factory-worker', description: 'Assembly line, packaging machine, helper' },
    { name: 'Farm Labour (खेत मजदूर)', slug: 'farm-labour', description: 'Crop harvesting, tractor operator, farm maintenance' },
    { name: 'Mason / Tile Work (राजमिस्त्री)', slug: 'mason-tile-work', description: 'Flooring, marble fitting, brick masonry' },
    { name: 'Beauty & Salon Services (ब्यूटी पार्लर)', slug: 'beauty-salon', description: 'Hair cutting, parlour staff, makeup artist' },
    { name: 'Catering & Event Staff (कैटरिंग)', slug: 'catering-event-staff', description: 'Event waiter, setup worker, food server' },
    { name: 'Packaging & Sorting (पैकेजिंग)', slug: 'packaging-sorting', description: 'Product packaging, labeling, quality check' },
    { name: 'Machine Operator (मशीन ऑपरेटर)', slug: 'machine-operator', description: 'CNC operator, lathe operator, printing operator' },
    { name: 'General Labour / Helper (हेल्पर)', slug: 'general-labour-helper', description: 'General assistance, site helper, shifting helper' },
  ];

  let catAdded = 0;
  for (const cat of categoriesData) {
    const exists = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({ ...cat, isActive: true }));
      catAdded++;
    }
  }
  if (catAdded > 0) {
    // eslint-disable-next-line no-console
    console.log(`✅ Seeded ${catAdded} new Blue-Collar categories.`);
  }

  // --- Locations seeding (India hierarchy) ---
  const { Location, LocationLevel } = await import('../entities/Location');
  const locationRepo = AppDataSource.getRepository(Location);

  let india = await locationRepo.findOne({ where: { slug: 'india' } });
  if (!india) {
    india = await locationRepo.save(
      locationRepo.create({ name: 'India', slug: 'india', level: LocationLevel.COUNTRY, isActive: true })
    );
  }

  const statesData = [
    { name: 'Maharashtra', slug: 'maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
    { name: 'Delhi NCR', slug: 'delhi-ncr', cities: ['New Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'] },
    { name: 'Karnataka', slug: 'karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'] },
    { name: 'Telangana', slug: 'telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad'] },
    { name: 'Tamil Nadu', slug: 'tamil-nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
    { name: 'West Bengal', slug: 'west-bengal', cities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'] },
    { name: 'Uttar Pradesh', slug: 'uttar-pradesh', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj'] },
    { name: 'Gujarat', slug: 'gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
    { name: 'Rajasthan', slug: 'rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
    { name: 'Punjab', slug: 'punjab', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Chandigarh'] },
    { name: 'Madhya Pradesh', slug: 'madhya-pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'] },
    { name: 'Bihar', slug: 'bihar', cities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'] },
  ];

  let locAdded = 0;
  for (const stateObj of statesData) {
    let state = await locationRepo.findOne({ where: { slug: stateObj.slug } });
    if (!state) {
      state = await locationRepo.save(
        locationRepo.create({ name: stateObj.name, slug: stateObj.slug, level: LocationLevel.STATE, parent: india, isActive: true })
      );
      locAdded++;
    }
    for (const cityName of stateObj.cities) {
      const citySlug = `${stateObj.slug}-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
      const cityExists = await locationRepo.findOne({ where: { slug: citySlug } });
      if (!cityExists) {
        await locationRepo.save(
          locationRepo.create({ name: cityName, slug: citySlug, level: LocationLevel.CITY, parent: state, isActive: true })
        );
        locAdded++;
      }
    }
  }
  if (locAdded > 0) {
    // eslint-disable-next-line no-console
    console.log(`✅ Seeded ${locAdded} Indian states and cities.`);
  }

  await AppDataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('   🛡️  Admin:    admin@example.com / ChangeMe123!');
  console.log('   👷  Worker:  w1@example.com / Worker123!');
  console.log('   🏢  Employer: e1@example.com / Employer123!');
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
