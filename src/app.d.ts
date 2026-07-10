// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthUser } from '$lib/types';

declare global {
  namespace App {
    interface Locals {
      rateLimit?: {
        limited: boolean;
        retryAfter: number;
      };
      user?: AuthUser | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
