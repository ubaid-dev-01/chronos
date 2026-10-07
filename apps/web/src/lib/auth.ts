import { redirect } from 'next/navigation';
import { connectDB, Organization } from '@chronos/db';
import type { IOrganization, PlanTier } from '@chronos/types';
import { getCurrentUser, requireActiveUser, requireAuth, requireRole } from './session';

export { getCurrentUser, requireAuth, requireActiveUser, requireRole };

interface LeanOrg {
  _id: unknown;
  name: string;
  slug: string;
  ownerId?: unknown;
  stripeCustomerId?: string;
  planTier: PlanTier;
  seatLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentOrg (): Promise<IOrganization | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectDB();
  const org = (await Organization.findById(user.orgId).lean()) as LeanOrg | null;
  if (!org) return null;

  return {
    _id: String(org._id),
    name: org.name,
    slug: org.slug,
    ownerId: org.ownerId ? String(org.ownerId) : undefined,
    stripeCustomerId: org.stripeCustomerId,
    planTier: org.planTier,
    seatLimit: org.seatLimit,
    isActive: org.isActive,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}

export async function requireOrg (): Promise<IOrganization> {
  const org = await getCurrentOrg();
  if (!org) redirect('/sign-up');
  return org;
}
