import { cookies } from 'next/headers';

export interface AdminSession {
  email: string;
  role: string;
  exp: number;
}

export async function checkAdminAuth(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(session.value, 'base64').toString('utf-8')
    ) as AdminSession;

    // Check if session has expired
    if (decoded.exp < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
