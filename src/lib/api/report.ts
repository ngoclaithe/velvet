import { api } from './core'
import type { ApiResponse } from '@/types/api'

export type ReportType = 'harassment' | 'spam' | 'inappropriate_content' | 'fake_profile' | 'other'
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed'

export interface CreateReportPayload {
  reportedUserId: number
  reason: string
  type: ReportType
  evidence?: string[]
}

export interface ReportItem {
  id: number
  reporterId: number
  reportedUserId: number
  reason: string
  type: ReportType
  status: ReportStatus
  evidence?: string[]
  adminNotes?: string | null
  actionTaken?: string | null
  createdAt: string
  updatedAt: string
  reporter?: { id: number; username?: string; avatar?: string | null }
  reportedUser?: { id: number; username?: string; avatar?: string | null }
}

export interface GetReportsQuery {
  page?: number
  limit?: number
  status?: ReportStatus
  type?: ReportType
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'type'
  sortOrder?: 'ASC' | 'DESC'
}

export interface GetMyReportsQuery {
  page?: number
  limit?: number
}

export interface ReportStatsQuery {
  startDate?: string
  endDate?: string
}

export interface UpdateReportStatusPayload {
  status: ReportStatus
  adminNotes?: string
  actionTaken?: string
}

function assertCreateReportValid(p: CreateReportPayload) {
  if (!Number.isInteger(p.reportedUserId) || p.reportedUserId < 1) {
    throw new Error('Invalid user ID')
  }
  if (typeof p.reason !== 'string' || p.reason.trim().length < 10 || p.reason.length > 1000) {
    throw new Error('Reason must be between 10-1000 characters')
  }
  const allowedTypes: ReportType[] = ['harassment', 'spam', 'inappropriate_content', 'fake_profile', 'other']
  if (!allowedTypes.includes(p.type)) {
    throw new Error('Invalid report type')
  }
  if (p.evidence !== undefined) {
    if (!Array.isArray(p.evidence)) throw new Error('Evidence must be an array')
  }
}

function assertGetReportsQueryValid(q?: GetReportsQuery) {
  if (!q) return
  if (q.page != null && (!Number.isInteger(q.page) || q.page < 1)) throw new Error('Page must be a positive integer')
  if (q.limit != null && (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100)) throw new Error('Limit must be between 1-100')
  if (q.status && !['pending','under_review','resolved','dismissed'].includes(q.status)) throw new Error('Invalid status')
  if (q.type && !['harassment','spam','inappropriate_content','fake_profile','other'].includes(q.type)) throw new Error('Invalid type')
  if (q.sortBy && !['createdAt','updatedAt','status','type'].includes(q.sortBy)) throw new Error('Invalid sortBy field')
  if (q.sortOrder && !['ASC','DESC'].includes(q.sortOrder)) throw new Error('Sort order must be ASC or DESC')
}

function assertGetMyReportsQueryValid(q?: GetMyReportsQuery) {
  if (!q) return
  if (q.page != null && (!Number.isInteger(q.page) || q.page < 1)) throw new Error('Page must be a positive integer')
  if (q.limit != null && (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100)) throw new Error('Limit must be between 1-100')
}

function assertStatsQueryValid(q?: ReportStatsQuery) {
  if (!q) return
  const isISO = (s: string) => !Number.isNaN(Date.parse(s))
  if (q.startDate != null && !isISO(q.startDate)) throw new Error('Invalid start date format')
  if (q.endDate != null && !isISO(q.endDate)) throw new Error('Invalid end date format')
}

function assertUpdateStatusValid(p: UpdateReportStatusPayload) {
  if (!['pending','under_review','resolved','dismissed'].includes(p.status)) throw new Error('Invalid status')
  if (p.adminNotes != null && p.adminNotes.length > 1000) throw new Error('Admin notes must not exceed 1000 characters')
  if (p.actionTaken != null && p.actionTaken.length > 1000) throw new Error('Action taken must not exceed 1000 characters')
}

export const reportApi = {
  create: (payload: CreateReportPayload): Promise<ApiResponse<ReportItem>> => {
    assertCreateReportValid(payload)
    return api.post('/reports', payload)
  },

  getReports: (query?: GetReportsQuery): Promise<ApiResponse<{ reports: ReportItem[]; total?: number; page?: number; totalPages?: number }>> => {
    assertGetReportsQueryValid(query)
    const params: Record<string,string> = {}
    if (query?.page != null) params.page = String(query.page)
    if (query?.limit != null) params.limit = String(query.limit)
    if (query?.status) params.status = query.status
    if (query?.type) params.type = query.type
    if (query?.sortBy) params.sortBy = query.sortBy
    if (query?.sortOrder) params.sortOrder = query.sortOrder
    return api.get('/reports', Object.keys(params).length ? params : undefined)
  },

  getMyReports: (query?: GetMyReportsQuery): Promise<ApiResponse<{ reports: ReportItem[]; total?: number; page?: number; totalPages?: number }>> => {
    assertGetMyReportsQueryValid(query)
    const params: Record<string,string> = {}
    if (query?.page != null) params.page = String(query.page)
    if (query?.limit != null) params.limit = String(query.limit)
    return api.get('/reports/me', Object.keys(params).length ? params : undefined)
  },

  getStats: (query?: ReportStatsQuery): Promise<ApiResponse<any>> => {
    assertStatsQueryValid(query)
    const params: Record<string,string> = {}
    if (query?.startDate) params.startDate = query.startDate
    if (query?.endDate) params.endDate = query.endDate
    return api.get('/reports/stats', Object.keys(params).length ? params : undefined)
  },

  getById: (id: number): Promise<ApiResponse<ReportItem>> => {
    if (!Number.isInteger(id) || id < 1) throw new Error('Invalid report ID')
    return api.get(`/reports/${id}`)
  },

  updateStatus: (id: number, payload: UpdateReportStatusPayload): Promise<ApiResponse<ReportItem>> => {
    if (!Number.isInteger(id) || id < 1) throw new Error('Invalid report ID')
    assertUpdateStatusValid(payload)
    return api.put(`/reports/${id}`, payload)
  },

  delete: (id: number): Promise<ApiResponse<{ id: number }>> => {
    if (!Number.isInteger(id) || id < 1) throw new Error('Invalid report ID')
    return api.delete(`/reports/${id}`)
  },
}
