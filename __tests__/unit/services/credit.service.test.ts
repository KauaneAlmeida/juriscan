import { describe, it, expect, vi } from "vitest";
import { deductCredits, addCredits } from "@/services/credit.service";

// Mock Supabase client factory
// The service uses supabase.rpc() for atomic credit operations
function createMockSupabase(options: {
  rpcData?: unknown;
  rpcError?: boolean;
}) {
  const { rpcData = true, rpcError = false } = options;

  return {
    rpc: vi.fn().mockResolvedValue({
      data: rpcError ? null : rpcData,
      error: rpcError ? { message: "RPC error" } : null,
    }),
  };
}

describe("credit.service", () => {
  describe("deductCredits", () => {
    it("should deduct credits successfully when RPC returns true", async () => {
      const mockSupabase = createMockSupabase({ rpcData: true });

      const result = await deductCredits(
        mockSupabase as never,
        "user-123",
        10,
        "Test deduction"
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("deduct_credits", {
        p_user_id: "user-123",
        p_amount: 10,
        p_description: "Test deduction",
        p_transaction_type: "ANALYSIS_DEBIT",
      });
    });

    it("should fail when balance is insufficient (RPC returns false)", async () => {
      const mockSupabase = createMockSupabase({ rpcData: false });

      const result = await deductCredits(
        mockSupabase as never,
        "user-123",
        10,
        "Test deduction"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Créditos insuficientes");
    });

    it("should fail when RPC returns error", async () => {
      const mockSupabase = createMockSupabase({ rpcError: true });

      const result = await deductCredits(
        mockSupabase as never,
        "user-123",
        10,
        "Test deduction"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro ao deduzir créditos");
    });

    it("should pass custom transaction type", async () => {
      const mockSupabase = createMockSupabase({ rpcData: true });

      await deductCredits(
        mockSupabase as never,
        "user-123",
        5,
        "Report deduction",
        "REPORT_DEBIT"
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith("deduct_credits", {
        p_user_id: "user-123",
        p_amount: 5,
        p_description: "Report deduction",
        p_transaction_type: "REPORT_DEBIT",
      });
    });

    it("should use default description and transaction type", async () => {
      const mockSupabase = createMockSupabase({ rpcData: true });

      await deductCredits(
        mockSupabase as never,
        "user-123",
        10
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith("deduct_credits", {
        p_user_id: "user-123",
        p_amount: 10,
        p_description: "Uso de créditos",
        p_transaction_type: "ANALYSIS_DEBIT",
      });
    });
  });

  describe("addCredits", () => {
    it("should add credits successfully and return new balance", async () => {
      const mockSupabase = createMockSupabase({ rpcData: 75 });

      const result = await addCredits(
        mockSupabase as never,
        "user-123",
        25,
        "Test addition"
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(75);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith("add_credits", {
        p_user_id: "user-123",
        p_amount: 25,
        p_description: "Test addition",
        p_transaction_type: "CREDIT_PURCHASE",
      });
    });

    it("should add credits to zero balance", async () => {
      const mockSupabase = createMockSupabase({ rpcData: 100 });

      const result = await addCredits(
        mockSupabase as never,
        "user-123",
        100,
        "Initial credits"
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(100);
    });

    it("should fail when RPC returns error", async () => {
      const mockSupabase = createMockSupabase({ rpcError: true });

      const result = await addCredits(
        mockSupabase as never,
        "user-123",
        25,
        "Test addition"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro ao adicionar créditos");
    });
  });
});
