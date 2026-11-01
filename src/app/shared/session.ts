/**
 * Sesiones de cada área de la app. Cada área guarda su propio token en localStorage
 * y tiene su propia pantalla de login.
 */
export interface SessionArea {
  /** Prefijo de ruta del área (p. ej. '/admin'). */
  prefix: string;
  tokenKey: string;
  loginPath: string;
  /** Roles del token con los que el área se considera autenticada. */
  roles: string[];
  /** Si el token se renueva automáticamente mientras se usa la app. */
  autoRefresh: boolean;
}

export const SESSION_AREAS: SessionArea[] = [
  { prefix: '/admin', tokenKey: 'cb_admin_token', loginPath: '/admin/login', roles: ['ADMIN'], autoRefresh: true },
  { prefix: '/cocina', tokenKey: 'cb_kitchen_token', loginPath: '/cocina/login', roles: ['KITCHEN'], autoRefresh: true },
  { prefix: '/domicilio', tokenKey: 'cb_delivery_token', loginPath: '/domicilio/login', roles: ['DELIVERY'], autoRefresh: true },
  { prefix: '/cuenta', tokenKey: 'cb_customer_token', loginPath: '/cuenta/login', roles: ['CUSTOMER'], autoRefresh: false },
];

export interface TokenPayload {
  sub?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export function readTokenPayload(token: string | null): TokenPayload | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: TokenPayload | null): boolean {
  return !payload?.exp || payload.exp * 1000 <= Date.now();
}

/** Token presente, no vencido y con uno de los roles esperados. */
export function hasValidSession(tokenKey: string, roles: string[]): boolean {
  const payload = readTokenPayload(localStorage.getItem(tokenKey));
  return !!payload?.role && roles.includes(payload.role) && !isTokenExpired(payload);
}

export function areaForUrl(url: string): SessionArea | undefined {
  return SESSION_AREAS.find(a => url === a.prefix || url.startsWith(a.prefix + '/') || url.startsWith(a.prefix + '?'));
}
