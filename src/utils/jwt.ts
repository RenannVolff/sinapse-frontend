interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

// Decodifica só o payload (parte do meio) do JWT, sem verificar assinatura.
// A verificação de assinatura é responsabilidade exclusiva do backend.
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    // Sem 'exp' no payload não há como afirmar que expirou; o backend segue como fonte da verdade.
    return false;
  }

  return payload.exp < Date.now() / 1000;
}
