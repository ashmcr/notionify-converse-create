import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

export const verifyJWT = async (token: string) => {
  console.log('[auth] Starting JWT verification');
  
  try {
    const jwt = token.replace('Bearer ', '');
    
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('[auth] JWT_SECRET is not set in environment variables');
      return null;
    }

    console.log('[auth] Attempting to verify JWT...');
    const { payload } = await jose.jwtVerify(
      jwt,
      new TextEncoder().encode(jwtSecret)
    );
    
    console.log('[auth] JWT verified successfully');
    return payload;
  } catch (error) {
    console.error('[auth] JWT verification failed:', error);
    return null;
  }
};