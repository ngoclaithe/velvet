import { api } from './core'

export const creatorAPI = {
    getAllCreators: () => api.get('/creators'),
    getCreatorById: (id: number) => api.get(`/creators/${id}`),
    getUsersFollowMe: () => api.get('/follows/followers'),
    deleteUserFollow: (userId: number) => api.delete(`/follows/followers/${userId}`),
    getFeaturedCreator: () => api.get('/creators/featured'),
}
