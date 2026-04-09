import type {
  PagarmeCustomer,
  PagarmeCreateCustomerRequest,
  PagarmePlan,
  PagarmeCreatePlanRequest,
  PagarmeSubscription,
  PagarmeCreateSubscriptionRequest,
  PagarmeOrder,
  PagarmeCreateOrderRequest,
} from "./types";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";

class PagarmeClient {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private get authHeader(): string {
    return "Basic " + Buffer.from(this.secretKey + ":").toString("base64");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${PAGARME_API_URL}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Pagar.me] API error:", response.status, errorData);
      throw new Error(
        `Pagar.me API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    return response.json() as Promise<T>;
  }

  // Customer operations
  async createCustomer(
    data: PagarmeCreateCustomerRequest
  ): Promise<PagarmeCustomer> {
    return this.request<PagarmeCustomer>("POST", "/customers", data);
  }

  async getCustomer(customerId: string): Promise<PagarmeCustomer> {
    return this.request<PagarmeCustomer>("GET", `/customers/${customerId}`);
  }

  async updateCustomer(
    customerId: string,
    data: Partial<PagarmeCreateCustomerRequest>
  ): Promise<PagarmeCustomer> {
    return this.request<PagarmeCustomer>(
      "PUT",
      `/customers/${customerId}`,
      data
    );
  }

  // Plan operations
  async createPlan(data: PagarmeCreatePlanRequest): Promise<PagarmePlan> {
    return this.request<PagarmePlan>("POST", "/plans", data);
  }

  async getPlan(planId: string): Promise<PagarmePlan> {
    return this.request<PagarmePlan>("GET", `/plans/${planId}`);
  }

  async listCustomers(size: number = 1): Promise<{ data: PagarmeCustomer[] }> {
    return this.request<{ data: PagarmeCustomer[] }>(
      "GET",
      `/customers?size=${size}`
    );
  }

  // Subscription operations
  async createSubscription(
    data: PagarmeCreateSubscriptionRequest
  ): Promise<PagarmeSubscription> {
    const body: Record<string, unknown> = {
      plan_id: data.plan_id,
      customer_id: data.customer_id,
      payment_method: data.payment_method,
      metadata: data.metadata,
    };

    if (data.payment_method === "credit_card" && data.card_token) {
      body.card_token = data.card_token;
    }

    return this.request<PagarmeSubscription>("POST", "/subscriptions", body);
  }

  async getSubscription(subscriptionId: string): Promise<PagarmeSubscription> {
    return this.request<PagarmeSubscription>(
      "GET",
      `/subscriptions/${subscriptionId}`
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<PagarmeSubscription> {
    return this.request<PagarmeSubscription>(
      "DELETE",
      `/subscriptions/${subscriptionId}`
    );
  }

  async updateSubscriptionCard(
    subscriptionId: string,
    cardToken: string
  ): Promise<PagarmeSubscription> {
    return this.request<PagarmeSubscription>(
      "PATCH",
      `/subscriptions/${subscriptionId}`,
      {
        payment_method: "credit_card",
        card_token: cardToken,
      }
    );
  }

  async updateSubscriptionPlan(
    subscriptionId: string,
    planId: string
  ): Promise<PagarmeSubscription> {
    return this.request<PagarmeSubscription>(
      "PATCH",
      `/subscriptions/${subscriptionId}`,
      { plan_id: planId }
    );
  }

  // Order operations (one-time purchases)
  async createOrder(data: PagarmeCreateOrderRequest): Promise<PagarmeOrder> {
    return this.request<PagarmeOrder>("POST", "/orders", data);
  }
}

// Lazy initialization
let pagarmeInstance: PagarmeClient | null = null;

export function getPagarme(): PagarmeClient {
  if (!pagarmeInstance) {
    if (!process.env.PAGARME_SECRET_KEY) {
      throw new Error("PAGARME_SECRET_KEY is not configured");
    }
    pagarmeInstance = new PagarmeClient(process.env.PAGARME_SECRET_KEY);
  }
  return pagarmeInstance;
}
