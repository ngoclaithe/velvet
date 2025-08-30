import type { StreamsApiResponse } from '@/types/streaming'
import { api } from './core'

export const streamApi = {
  getLiveStreams: (params?: {
    limit?: number;
    offset?: number;
    category?: string;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();
    if (params?.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params?.category) queryParams.category = params.category;

    return api.get<StreamsApiResponse['data']>('/streams/live', queryParams);
  },

  getStreamInfo: (streamId: string) => api.get<any>(`/streams/${streamId}/info`),

  startStream: (data: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) => api.post<{
    id?: string | number;
    streamId?: string | number;
    streamKey: string;
    socketEndpoint: string;
    title?: string;
    isLive?: boolean;
  }>('/streams/start', data),

  stopStream: (streamId: string) => api.post(`/streams/${streamId}/stop`),

  getStreamStats: () => api.get('/streams/stats'),

  getStreams: (params?: Record<string, string>) => api.get('/streams/live', params),
  getStream: (streamId: string) => api.get(`/streams/${streamId}/info`),
  createStream: (data: any) => api.post('/streams/start', data),
  endStream: (streamId: string) => api.post(`/streams/${streamId}/stop`),
  joinStream: (streamId: string) => api.post(`/streams/${streamId}/join`),
  leaveStream: (streamId: string) => api.post(`/streams/${streamId}/leave`),
}
