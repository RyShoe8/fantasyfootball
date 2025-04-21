/**
 * API Type Definitions
 * 
 * Type definitions for API-related types and utilities.
 */

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export function toApiError(error: any): ApiError {
  if (error instanceof Error) {
    return error as ApiError;
  }
  
  const apiError = new Error(error.message || 'An unknown error occurred') as ApiError;
  apiError.status = error.status;
  apiError.code = error.code;
  apiError.details = error.details;
  
  return apiError;
} 