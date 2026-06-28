export const ADMIN_EMAILS = ['casamentomatisa@gmail.com'] as const;

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes(normalizeAdminEmail(email) as (typeof ADMIN_EMAILS)[number]);
}
