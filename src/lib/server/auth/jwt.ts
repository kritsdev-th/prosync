import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET } from '$env/static/private';
import type { JWTPayload } from '$lib/types/auth';

const secret = new TextEncoder().encode(JWT_SECRET);

export async function signAccessToken(payload: JWTPayload): Promise<string> {
	return new SignJWT({ ...payload } as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('15m')
		.sign(secret);
}

export async function signRefreshToken(userId: number): Promise<string> {
	return new SignJWT({ sub: userId } as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('7d')
		.sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, secret);
		return payload as unknown as JWTPayload;
	} catch {
		return null;
	}
}

export async function verifyRefreshToken(token: string): Promise<{ sub: number } | null> {
	try {
		const { payload } = await jwtVerify(token, secret);
		return { sub: Number(payload.sub) };
	} catch {
		return null;
	}
}
