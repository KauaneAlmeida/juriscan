// Re-export all types
export * from "./database";
export * from "./admin";

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN" | "SUPPORT";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  oab: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// UI State types
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}
