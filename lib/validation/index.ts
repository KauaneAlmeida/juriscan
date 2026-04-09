// Common schemas
export {
  uuidSchema,
  paginationSchema,
  sortSchema,
  dateRangeSchema,
  searchSchema,
  emailSchema,
  phoneSchema,
  cpfSchema,
  oabSchema,
  type PaginationParams,
  type SortParams,
  type DateRangeParams,
  type SearchParams,
} from "./common";

// User schemas
export {
  profileSchema,
  updateProfileSchema,
  acceptTermsSchema,
  changePasswordSchema,
  deleteAccountSchema,
  type Profile,
  type UpdateProfileInput,
  type AcceptTermsInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "./user";

// Credit schemas
export {
  creditOperationType,
  deductCreditsSchema,
  addCreditsSchema,
  creditBalanceSchema,
  creditTransactionSchema,
  purchaseCreditsSchema,
  creditPackageSchema,
  type CreditOperationType,
  type DeductCreditsInput,
  type AddCreditsInput,
  type CreditBalance,
  type CreditTransaction,
  type PurchaseCreditsInput,
  type CreditPackage,
} from "./credits";

// Chat and conversation schemas (from existing schemas.ts)
export {
  chatMessageSchema,
  createConversationSchema,
  updateConversationSchema,
  validateBody,
  validateUuid,
  type ChatMessageInput,
  type CreateConversationInput,
  type UpdateConversationInput,
} from "./schemas";

// Pagar.me schemas
export {
  subscribeSchema,
  purchaseCreditsSchema as pagarmePurchaseCreditsSchema,
  cancelSubscriptionSchema,
  updatePaymentSchema,
  upgradePlanSchema,
  type SubscribeInput,
  type PurchaseCreditsInput as PagarmePurchaseCreditsInput,
  type CancelSubscriptionInput,
  type UpdatePaymentInput,
  type UpgradePlanInput,
} from "./pagarme";
