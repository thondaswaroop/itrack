// API Configuration and Base Service
// This file provides the base API functionality for all services

// API Base URL - Update this with your actual domain
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/itrack/api_db/api/api.php';

// API Response type
export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

// User data stored in localStorage
export interface UserData {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'super_admin' | 'vendor' | 'associate' | 'customer';
  status: string;
  last_login?: string;
}

// Get current user from localStorage
export const getCurrentUser = (): UserData | null => {
  const userStr = localStorage.getItem('itrack_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Save user to localStorage
export const saveUser = (user: UserData): void => {
  localStorage.setItem('itrack_user', JSON.stringify(user));
};

// Remove user from localStorage
export const clearUser = (): void => {
  localStorage.removeItem('itrack_user');
  localStorage.removeItem('UserDetails'); // Also clear legacy format
};

// Get user ID for API requests
export const getUserId = (): number | null => {
  // First check the UserDetails format (used by SignIn.tsx)
  const userDetailsStr = localStorage.getItem('UserDetails');
  if (userDetailsStr) {
    try {
      const userDetails = JSON.parse(userDetailsStr);
      const userId = typeof userDetails.userId === 'string' ? parseInt(userDetails.userId) : userDetails.userId;
      if (userId && !isNaN(userId)) return userId;
    } catch {}
  }
  
  // Fallback to itrack_user format
  const user = getCurrentUser();
  return user?.id || null;
};

// Base API request function
export const apiRequest = async <T = any>(
  action: string,
  data: Record<string, any> = {},
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // Get current user for authentication
    const userId = getUserId();
    
    const requestData = {
      action,
      ...data,
    };

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Send authenticated user ID in header, not in request body
        ...(userId && { 'X-User-ID': userId.toString() }),
        ...options.headers,
      },
      body: JSON.stringify(requestData),
      ...options,
    };

    const response = await fetch(API_BASE_URL, config);

    // Always try to parse JSON response first to get API error messages
    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, throw HTTP error
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle API errors (check status field in response)
    if (!result.status) {
      throw new Error(result.error || result.message || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// GET request (for public endpoints)
export const apiGet = async <T = any>(
  action: string,
  params: Record<string, any> = {}
): Promise<ApiResponse<T>> => {
  try {
    // Get current user for authentication
    const userId = getUserId();
    
    const queryParams = new URLSearchParams({
      action,
      ...params,
    }).toString();

    const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Send authenticated user ID in header
        ...(userId && { 'X-User-ID': userId.toString() }),
      },
    });

    // Always try to parse JSON response first to get API error messages
    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, throw HTTP error
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!result.status) {
      throw new Error(result.error || result.message || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API GET Error:', error);
    throw error;
  }
};

// Error handler helper
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Check if user has specific role
export const hasRole = (role: string | string[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};

// Logout helper
export const logout = (): void => {
  clearUser();
  window.location.href = '/auth/signin';
};
