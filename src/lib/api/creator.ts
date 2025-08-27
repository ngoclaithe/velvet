import { api } from './core'

export const creatorAPI = {
    getAllCreators: () => api.get('/creators'),
    getUsersFollowMe: () => api.get('/follows/followers'),
    deleteUserFollow: (userId: number) => api.delete(`/follows/followers/${userId}`),
}