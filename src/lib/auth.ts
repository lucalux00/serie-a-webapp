import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'super-secret-key-for-serie-a-webapp-dev-only';
  if (!secret || secret.length === 0) {
    throw new Error('The environment variable JWT_SECRET is not set.');
  }
  return new TextEncoder().encode(secret);
};

export const signJwt = async (payload: { userId: number; email: string; name: string }) => {
  try {
    const secret = getJwtSecretKey();
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  } catch (error) {
    throw error;
  }
};

export const verifyJwt = async (token: string) => {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number; email: string; name: string; exp: number };
  } catch (error) {
    return null;
  }
};

export const getUserFromCookie = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  
  const payload = await verifyJwt(token);
  return payload;
};
