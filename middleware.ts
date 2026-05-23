// Middleware disabled — auth is enforced in each server page via requireAuth().
// Keeping this file empty avoids Edge Runtime incompatibility with next-pwa webpack plugin.
export function middleware() {}
export const config = { matcher: [] }
