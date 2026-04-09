import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  InsufficientCreditsError,
  ForbiddenError,
  RateLimitError,
} from "@/lib/api/errors";

describe("API Errors", () => {
  describe("AppError", () => {
    it("should create error with all properties", () => {
      const error = new AppError("TEST_ERROR", "Test message", 400, { field: "value" });

      expect(error.code).toBe("TEST_ERROR");
      expect(error.message).toBe("Test message");
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: "value" });
      expect(error.name).toBe("AppError");
    });

    it("should use default status 400", () => {
      const error = new AppError("TEST", "Test");
      expect(error.status).toBe(400);
    });
  });

  describe("ValidationError", () => {
    it("should have correct code and status", () => {
      const error = new ValidationError("Campo inválido", { field: "email" });

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.status).toBe(400);
      expect(error.message).toBe("Campo inválido");
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("AuthError", () => {
    it("should have correct code and status", () => {
      const error = new AuthError();

      expect(error.code).toBe("AUTH_ERROR");
      expect(error.status).toBe(401);
      expect(error.message).toBe("Não autorizado");
    });

    it("should allow custom message", () => {
      const error = new AuthError("Token expirado");
      expect(error.message).toBe("Token expirado");
    });
  });

  describe("ForbiddenError", () => {
    it("should have correct code and status", () => {
      const error = new ForbiddenError();

      expect(error.code).toBe("FORBIDDEN");
      expect(error.status).toBe(403);
      expect(error.message).toBe("Acesso negado");
    });
  });

  describe("NotFoundError", () => {
    it("should include resource name in message", () => {
      const error = new NotFoundError("Usuário");

      expect(error.code).toBe("NOT_FOUND");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Usuário não encontrado");
    });
  });

  describe("InsufficientCreditsError", () => {
    it("should have correct code and status", () => {
      const error = new InsufficientCreditsError();

      expect(error.code).toBe("INSUFFICIENT_CREDITS");
      expect(error.status).toBe(402);
      expect(error.message).toBe("Créditos insuficientes");
    });

    it("should include required and available in details", () => {
      const error = new InsufficientCreditsError(10, 5);

      expect(error.details).toEqual({ required: 10, available: 5 });
    });
  });

  describe("RateLimitError", () => {
    it("should have correct code and status", () => {
      const error = new RateLimitError(60);

      expect(error.code).toBe("RATE_LIMIT");
      expect(error.status).toBe(429);
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });
});
