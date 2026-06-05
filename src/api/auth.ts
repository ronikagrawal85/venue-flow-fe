import api from "./axios";
import type { AxiosResponse } from "axios";
import type { LoginResponse, Session } from "../types";

export const register = (
  email: string,
  password: string,
  name?: string,
): Promise<AxiosResponse> =>
  api.post("/auth/register", { email, password, name });

export const login = (
  email: string,
  password: string,
): Promise<AxiosResponse<LoginResponse>> =>
  api.post("/auth/login", { email, password });

export const refreshToken = (): Promise<
  AxiosResponse<{ access_token: string }>
> => api.post("/auth/refresh");

export const logout = (): Promise<AxiosResponse<{ message: string }>> =>
  api.post("/auth/logout");

export const logoutAll = (): Promise<AxiosResponse<{ message: string }>> =>
  api.post("/auth/logout-all");

export const getSessions = (): Promise<AxiosResponse<Session[]>> =>
  api.get("/auth/sessions");

export const initiateGoogleLogin = (): void => {
  const apiBase = import.meta.env.VITE_API_URL as string;
  // const backendOrigin = apiBase.replace(/\/v1\/?$/, "");
  window.location.href = `${apiBase}/auth/google`;
};
