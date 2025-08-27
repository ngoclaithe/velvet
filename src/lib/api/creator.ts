import { api } from './core'

export const creatorAPI = {
    getAllCreators: () => api.get('/creator'),
    getUsersFollowMe: () => api.get('/follows/followers'),
    deleteUserFollow: (userId: number) => api.delete(`/follows/followers/${userId}`),
}