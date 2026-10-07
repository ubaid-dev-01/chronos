import { NextResponse } from 'next/server';
import { connectDB, getInvitePreview } from '@chronos/db';

export async function GET (
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await connectDB();
    const data = await getInvitePreview(token);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invitation not found or expired' },
      { status: 404 }
    );
  }
}
