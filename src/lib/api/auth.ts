import { api } from './core'

export const authApi = {
  login: (credentials: { loginField: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    referralCode?: string;
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  refreshToken: () => api.post('/auth/refresh-token'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgotpassword', { email }),

  resetPassword: (resettoken: string, password: string) =>
    api.put(`/auth/resetpassword/${encodeURIComponent(resettoken)}`, { password }),

  updateDetails: (data: any) => api.put('/auth/updatedetails', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/updatepassword', data),

  checkUsername: (username: string) => api.get(`/auth/check-username/${encodeURIComponent(username)}`),

  checkEmail: (email: string) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),

  registerCreator: (data: {
    stageName: string;
    bio?: string;
    hourlyRate?: number;
    minBookingDuration?: number;
    bookingPrice?: number;
    subscriptionPrice?: number;
    height?: number;
    weight?: number;
  }) => api.post('/auth/creator/register', data),

  getCreatorProfile: () => api.get('/auth/creator/profile'),

  updateCreatorProfile: (data: any) => api.put('/auth/creator/profile', data),
}