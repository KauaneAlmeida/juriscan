import { NextResponse } from "next/server";
import { AppError } from "./errors";

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a successful JSON response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Creates an error JSON response from an AppError or generic Error
 */
export function errorResponse(error: AppError | Error): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    );
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno do servidor",
      },
    },
    { status: 500 }
  );
}

/**
 * Creates a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  }
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
      hasMore: pagination.page * pagination.pageSize < pagination.total,
    },
  });
}

/**
 * Creates a 204 No Content response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
