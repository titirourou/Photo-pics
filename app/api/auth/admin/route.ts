import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (password === ADMIN_PASSWORD) {
    // Set a cookie to maintain the session
    cookies().set('user_type', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, message: 'Invalid password' },
    { status: 401 }
  )
} 