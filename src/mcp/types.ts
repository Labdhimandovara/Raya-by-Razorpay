// Raya MCP Integration Layer - Type Definitions
// Compliant with Model Context Protocol (MCP) JSON-RPC 2.0 & Raya Commerce Architecture

export type RankingObjective = "best_value" | "cheapest" | "performance" | "fastest";

export interface IntentExtraction {
  category?: string;
  maxPrice?: number;
  objective: RankingObjective;
  priorities: string[];
  rawQuery: string;
}

export interface RecommendationContext {
  overall_score: number;
  intent_match: number;
  quality_score: number;
  value_score: number;
  rating_score: number;
  merchant_trust: number;
  availability_score: number;
  why_recommended: string;
  tradeoffs: string[];
  alternatives: Array<{
    product_id: string;
    name: string;
    price: number;
    currency: string;
    reason: string;
  }>;
}

export interface StructuredProduct {
  product_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  store: string;
  store_url?: string;
  product_url?: string;
  rating: number;
  stock: number;
  category: string;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  key_features: string[];
  source: string;
  recommendation_context?: RecommendationContext;
  is_best_match?: boolean;
}

export interface CartSessionItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  store: string;
  merchant: string;
  imageUrl?: string;
}

export interface CartSession {
  cart_id: string;
  items: CartSessionItem[];
  subtotal: number;
  currency: string;
  created_at: string;
  updated_at: string;
  budget_limit?: number;
  store?: string;
}

export interface SafetyGateCheck {
  gate: string;
  name: string;
  passed: boolean;
  actual: any;
  limit: any;
  message: string;
}

export interface SafetyEvaluationResult {
  allowed: boolean;
  checks: SafetyGateCheck[];
  rejection_reason?: string;
  blocked_code?: string;
}

export interface CheckoutOrderDraft {
  checkout_order_id: string;
  cart_id: string;
  items: CartSessionItem[];
  total_amount: number;
  currency: string;
  recipient_name: string;
  delivery_address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  safety_evaluation: SafetyEvaluationResult;
  status: "READY_FOR_APPROVAL" | "BLOCKED" | "EXPIRED";
  created_at: string;
  expires_at: string;
}

export interface PurchaseApprovalResult {
  approved: boolean;
  approval_token?: string;
  expires_in_minutes?: number;
  razorpay_order_id?: string;
  amount_paise?: number;
  currency?: string;
  payment_method_instruction?: string;
  status: "APPROVED_AWAITING_PAYMENT" | "APPROVAL_INVALIDATED" | "REJECTED" | "APPROVAL_REQUIRED";
  message: string;
  audit_event_id?: string;
  details?: Record<string, any>;
}

export interface OrderRecord {
  order_id: string;
  cart_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: "PENDING_PAYMENT" | "PAID" | "VERIFIED" | "CANCELLED";
  items: CartSessionItem[];
  recipient_name: string;
  merchant: string;
  store: string;
  created_at: string;
  verified_at?: string;
  decision_audit_id?: string;
}

// Standard MCP JSON-RPC 2.0 Interfaces
export interface McpToolDeclaration {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface McpResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
