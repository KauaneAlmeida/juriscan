/**
 * Custom error classes for API responses
 * Provides consistent error handling across all API routes
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Não autorizado") {
    super("AUTH_ERROR", message, 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} não encontrado`, 404);
    this.name = "NotFoundError";
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required?: number, available?: number) {
    const details = required !== undefined && available !== undefined
      ? { required, available }
      : undefined;
    super("INSUFFICIENT_CREDITS", "Créditos insuficientes", 402, details);
    this.name = "InsufficientCreditsError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("RATE_LIMIT", "Muitas requisições. Tente novamente mais tarde.", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class InternalError extends AppError {
  constructor(message = "Erro interno do servidor") {
    super("INTERNAL_ERROR", message, 500);
    this.name = "InternalError";
  }
}
