import api from './axios';
import type { AxiosResponse } from 'axios';

export const getProfile = (): Promise<AxiosResponse> =>
  api.get('/users/me/profile');

export const updateProfile = (
  data: { name?: string; phone?: string },
): Promise<AxiosResponse> =>
  api.patch('/users/me/profile', data);

export const uploadAvatar = (file: File): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.patch('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
