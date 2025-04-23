import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Delete the user_type cookie
  cookies().delete('user_type');
  
  return NextResponse.json({ success: true });
} 