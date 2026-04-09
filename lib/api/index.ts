// Error classes
export {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  InsufficientCreditsError,
  RateLimitError,
  ConflictError,
  InternalError,
} from "./errors";

// Response helpers
export {
  successResponse,
  errorResponse,
  paginatedResponse,
  noContentResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from "./response";

// Handler wrapper
export {
  apiHandler,
  parseBody,
  parseSearchParams,
  type ApiContext,
} from "./handler";

// Rate limiting (re-export for convenience)
export { RATE_LIMITS } from "@/lib/rate-limit";
export type { RateLimitConfig } from "@/lib/rate-limit";
