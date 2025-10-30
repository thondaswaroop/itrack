// src/utils/auth.ts
import type { Role, UserDetails } from "../constants/common"

export const getUser = (): UserDetails | null => {
  try {
    const raw = localStorage.getItem("UserDetails")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getRole = (): Role | null => {
  const u = getUser()
  if (!u) return null
  const r = Number((u as any).roleId)
  return Number.isNaN(r) ? null : (r as Role)
}

export const hasAnyRole = (allowed?: Role[]): boolean => {
  if (!allowed || allowed.length === 0) return true // login-only
  const role = getRole()
  return role !== null && allowed.includes(role)
}
