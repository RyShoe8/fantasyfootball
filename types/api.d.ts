/**
 * API Type Declarations
 * 
 * Type declarations for API services and responses.
 */

import { AxiosError } from 'axios';

// Extend Error type to include Axios error details
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

// Helper type for API responses
export type ApiResponse<T> = {
  data: T;
  error?: ApiError;
};

// Helper type for API error handling
export type ApiErrorHandler = (error: unknown) => ApiError;

// Helper function to convert unknown error to ApiError
export function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    if ('response' in error) {
      const axiosError = error as AxiosError;
      apiError.status = axiosError.response?.status;
      apiError.statusText = axiosError.response?.statusText;
      apiError.data = axiosError.response?.data;
    }
    return apiError;
  }
  return new Error('Unknown error occurred') as ApiError;
} 