import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const USER_PASSWORD = process.env.USER_PASSWORD || 'user123'

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (password === USER_PASSWORD) {
    // Set a cookie to maintain the session
    cookies().set('user_type', 'user', {
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