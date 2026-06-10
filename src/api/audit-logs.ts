import api from './axios';
import type { AxiosResponse } from 'axios';

interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const getAuditLogs = (params?: AuditLogParams): Promise<AxiosResponse> =>
  api.get('/audit-logs', { params });

export const getAuditLog = (id: string): Promise<AxiosResponse> =>
  api.get(`/audit-logs/${id}`);
