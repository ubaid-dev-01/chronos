/**
 * Seeds the platform superadmin from env vars.
 *
 * Usage:
 *   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... pnpm seed:superadmin
 */
import bcrypt from 'bcryptjs';
import { connectDB, mongoose, PlatformAdmin } from '../src/index';

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'Missing SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD in environment.'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('SUPERADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await PlatformAdmin.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      displayName: 'Platform Super Admin',
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Superadmin seeded: ${admin.email}`);
  await mongoose.disconnect();
}

seedSuperAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
