import { api } from './core'

export interface CreateGiftData {
  name: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  price: number;
  category?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UpdateGiftData {
  name?: string;
  description?: string;
  imageUrl?: string;
  animationUrl?: string;
  price?: number;
  category?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  isActive?: boolean;
}

export interface SearchGiftParams {
  q?: string;
  category?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export const giftApi = {
  // Tạo gift mới (Admin only)
  createGift: (data: CreateGiftData) =>
    api.post('/stream-gifts', data),

  // Lấy danh sách tất cả gifts
  getAllGifts: (params?: { category?: string; rarity?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.rarity) queryParams.append('rarity', params.rarity);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    return api.get(`/stream-gifts${queryString ? `?${queryString}` : ''}`);
  },

  // Lấy gift theo ID
  getGiftById: (id: string | number) =>
    api.get(`/stream-gifts/${id}`),

  // Cập nhật gift (Admin only)
  updateGift: (id: string | number, data: UpdateGiftData) =>
    api.put(`/stream-gifts/${id}`, data),

  // Xóa gift (Admin only)
  deleteGift: (id: string | number) =>
    api.delete(`/stream-gifts/${id}`),

  // Lấy gifts theo category
  getGiftsByCategory: (category: string) =>
    api.get(`/stream-gifts/category/${category}`),

  // Lấy gifts theo rarity
  getGiftsByRarity: (rarity: 'common' | 'rare' | 'epic' | 'legendary') =>
    api.get(`/stream-gifts/rarity/${rarity}`),

  // Tìm kiếm gifts
  searchGifts: (params?: SearchGiftParams) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.rarity) queryParams.append('rarity', params.rarity);
    if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    return api.get(`/stream-gifts/search${queryString ? `?${queryString}` : ''}`);
  }
}