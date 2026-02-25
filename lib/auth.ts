import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-prod'
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod'

export interface JWTPayload {
  userId: string
  email: string
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(userId: string, email: string) {
  const payload: JWTPayload = { userId, email }

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })

  const refreshToken = jwt.sign(payload, refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })

  return { accessToken, refreshToken }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, accessSecret) as JWTPayload
    return payload
  } catch {
    return null
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, refreshSecret) as JWTPayload
    return payload
  } catch {
    return null
  }
}

/**
 * Decode token without verification (use with caution)
 */
export function decodeToken(token: string) {
  try {
    return jwt.decode(token) as JWTPayload | null
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}
