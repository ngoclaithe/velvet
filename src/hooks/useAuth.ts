import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/auth'

export function useAuth() {
  const {
    user,
    session,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  } = useAuthStore()

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!session) return

    const timeUntilExpiry = session.expiresAt.getTime() - Date.now()
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000 // Refresh 5 minutes before expiry

    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        refreshToken().catch(() => {
          // If refresh fails, user will be logged out automatically
        })
      }, refreshTime)

      return () => clearTimeout(timeout)
    }
  }, [session, refreshToken])

  const isAuthenticated = !!user && !!session && user.role !== 'guest'
  const isGuest = user?.role === 'guest'
  const isTokenExpired = session ? session.expiresAt.getTime() < Date.now() : false

  const hasRole = (role: User['role']) => {
    return user?.role === role
  }

  const hasAnyRole = (roles: User['role'][]) => {
    return user ? roles.includes(user.role) : false
  }

  const isCreator = () => hasAnyRole(['creator', 'admin'])
  const isModerator = () => hasAnyRole(['moderator', 'admin'])
  const isAdmin = () => hasRole('admin')

  // Permissions for different actions
  const canPost = () => isAuthenticated && hasAnyRole(['user', 'creator', 'admin'])
  const canComment = () => isAuthenticated && hasAnyRole(['user', 'creator', 'admin'])
  const canViewContent = () => true // Everyone can view content

  return {
    // State
    user,
    session,
    isLoading,
    error,
    isAuthenticated,
    isGuest,
    isTokenExpired,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateProfile,

    // Utility functions
    hasRole,
    hasAnyRole,
    isCreator,
    isModerator,
    isAdmin,

    // Permission functions
    canPost,
    canComment,
    canViewContent,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page or show login modal
      window.location.href = '/login'
    }
  }, [auth.isLoading, auth.isAuthenticated])

  return auth
}

export function useRequireRole(requiredRole: User['role'] | User['role'][]) {
  const auth = useAuth()

  const hasRequiredRole = Array.isArray(requiredRole)
    ? auth.hasAnyRole(requiredRole)
    : auth.hasRole(requiredRole)

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !hasRequiredRole) {
      // Redirect to unauthorized page or show error
      window.location.href = '/unauthorized'
    }
  }, [auth.isLoading, auth.isAuthenticated, hasRequiredRole])

  return {
    ...auth,
    hasRequiredRole,
  }
}
