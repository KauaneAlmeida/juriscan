// Pagar.me V5 API Types

export interface PagarmeCustomer {
  id: string;
  name: string;
  email: string;
  document: string;
  document_type: "CPF" | "CNPJ";
  type: "individual" | "company";
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

export interface PagarmeCreateCustomerRequest {
  name: string;
  email: string;
  document: string;
  document_type: "CPF" | "CNPJ";
  type: "individual" | "company";
  phones?: PagarmeCustomer["phones"];
}

export interface PagarmeCardData {
  card_token: string;
}

export interface PagarmePixPaymentInfo {
  qr_code: string;
  qr_code_url: string;
  expires_at: string;
}

export interface PagarmeBoletoPaymentInfo {
  barcode: string;
  line: string;
  pdf: string;
  due_at: string;
}

export interface PagarmeCharge {
  id: string;
  code: string;
  amount: number;
  status: "pending" | "paid" | "canceled" | "failed" | "processing";
  payment_method: "credit_card" | "pix" | "boleto";
  last_transaction?: {
    id: string;
    status: string;
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
    barcode?: string;
    line?: string;
    pdf?: string;
    due_at?: string;
  };
}

export interface PagarmeSubscription {
  id: string;
  code: string;
  plan_id: string;
  customer: PagarmeCustomer;
  status: "active" | "canceled" | "future" | "pending" | "expired";
  payment_method: "credit_card" | "boleto" | "pix";
  current_cycle?: {
    id: string;
    start_at: string;
    end_at: string;
    cycle: number;
    status: string;
  };
  next_billing_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, string>;
}

export interface PagarmeCreateSubscriptionRequest {
  plan_id: string;
  customer_id: string;
  payment_method: "credit_card" | "boleto" | "pix";
  card_token?: string;
  metadata?: Record<string, string>;
}

export interface PagarmePlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year" | "week" | "day";
  interval_count: number;
  status: "active" | "inactive" | "deleted";
}

export interface PagarmeCreatePlanRequest {
  name: string;
  currency: string;
  interval: "month" | "year" | "week" | "day";
  interval_count: number;
  quantity?: number;
  payment_methods?: string[];
  installments?: number[];
  billing_type?: "prepaid" | "postpaid" | "exact_day";
  pricing_scheme: {
    price: number;
    scheme_type: "unit" | "volume" | "tier" | "package";
  };
  metadata?: Record<string, string>;
}

export interface PagarmeOrder {
  id: string;
  code: string;
  amount: number;
  status: "pending" | "paid" | "canceled" | "failed";
  customer: PagarmeCustomer;
  charges: PagarmeCharge[];
  closed: boolean;
  created_at: string;
}

export interface PagarmeCreateOrderRequest {
  customer_id: string;
  items: Array<{
    amount: number;
    description: string;
    quantity: number;
    code: string;
  }>;
  payments: Array<{
    payment_method: "credit_card" | "pix" | "boleto";
    credit_card?: {
      card_token: string;
      installments: number;
      statement_descriptor?: string;
    };
    pix?: {
      expires_in: number;
    };
    boleto?: {
      due_at: string;
      instructions: string;
    };
    amount: number;
  }>;
  metadata?: Record<string, string>;
}

// Webhook event types
export type PagarmeWebhookEventType =
  | "subscription.created"
  | "subscription.canceled"
  | "subscription.updated"
  | "charge.paid"
  | "charge.payment_failed"
  | "charge.pending"
  | "charge.refunded"
  | "order.paid"
  | "order.canceled";

export interface PagarmeWebhookEvent {
  id: string;
  type: PagarmeWebhookEventType;
  data: {
    id: string;
    code?: string;
    status?: string;
    amount?: number;
    customer?: PagarmeCustomer;
    subscription?: PagarmeSubscription;
    charge?: PagarmeCharge;
    metadata?: Record<string, string>;
    [key: string]: unknown;
  };
  created_at: string;
}

export type PaymentMethod = "credit_card" | "pix" | "boleto";
