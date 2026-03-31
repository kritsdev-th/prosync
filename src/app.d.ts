import type { JWTPayload } from '$lib/types/auth';

declare global {
	namespace App {
		interface Locals {
			user: JWTPayload | null;
		}
	}
}

export {};
