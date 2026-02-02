import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple admin credentials - in production, use a database
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create session token (simple approach - use JWT in production)
      const sessionToken = Buffer.from(
        JSON.stringify({ email, role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 })
      ).toString('base64');

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Login successful',
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
