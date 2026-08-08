/** Returns true for any role that carries admin-level access (admin or owner). */
export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'owner';
}
