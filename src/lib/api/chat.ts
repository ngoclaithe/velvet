import { api } from './core'

export const chatApi = {
  getMessages: (streamId: string, params?: Record<string, string>) =>
    api.get(`/streams/${streamId}/messages`, params),
  
  sendMessage: (streamId: string, data: any) =>
    api.post(`/streams/${streamId}/messages`, data),
  
  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
  
  getConversations: () => api.get('/conversations'),
  
  getConversation: (conversationId: string) =>
    api.get(`/conversations/${conversationId}`),
  
  sendDirectMessage: (conversationId: string, data: any) =>
    api.post(`/conversations/${conversationId}/messages`, data),
}