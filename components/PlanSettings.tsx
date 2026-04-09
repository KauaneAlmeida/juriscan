"use client";

import { useState } from "react";
import { Check, Loader2, Star, X } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, CREDIT_PACKAGES, EXTRA_CREDIT_PRICE } from "@/lib/pagarme/config";
import CheckoutModal from "@/components/Checkout/CheckoutModal";

// Plans to display in the pricing grid (exclude hidden free plan)
const VISIBLE_PLANS = Object.values(PLANS).filter((p) => p.id !== "free");

export default function PlanSettings() {
  const {
    balance,
    transactions,
    subscription,
    isLoading,
    refetch,
  } = useCredits();

  const { cancel, isCanceling } = useSubscription();

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    mode: "subscription" | "credits";
    planId?: string;
    creditPackageId?: string;
    title: string;
  }>({
    isOpen: false,
    mode: "subscription",
    title: "",
  });

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentPlanId = subscription?.plan_id || "free";
  const currentPlan = PLANS[currentPlanId as keyof typeof PLANS] || PLANS.free;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "usage" ? "-" : "+";
    return `${prefix}${Math.abs(amount)} créditos`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const openSubscribeModal = (planId: string) => {
    const plan = PLANS[planId as keyof typeof PLANS];
    setCheckoutModal({
      isOpen: true,
      mode: "subscription",
      planId,
      title: `Assinar plano ${plan.name}`,
    });
  };

  const openCreditPurchaseModal = (packageId: string) => {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    setCheckoutModal({
      isOpen: true,
      mode: "credits",
      creditPackageId: packageId,
      title: `Comprar ${pkg?.credits} créditos`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-[#7aa6ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Hero Card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #1C398E 0%, #2563EB 100%)",
        }}
      >
        <div>
          <h2 className="text-xl font-semibold text-white">
            Plano {currentPlan.name}
          </h2>
          <p className="text-sm text-blue-200 mt-1">
            {currentPlan.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-6 sm:gap-12 mt-5">
          <div>
            <p className="text-[13px] text-blue-200">Créditos disponíveis</p>
            <p className="text-4xl font-bold text-white mt-1">{balance}</p>
          </div>
          {subscription?.current_period_end && (
            <div>
              <p className="text-[13px] text-blue-200">Próxima renovação</p>
              <p className="text-xl font-semibold text-white mt-1">
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
          )}
        </div>

        {subscription && (
          <div className="flex gap-3 mt-5">
            {subscription.cancel_at_period_end ? (
              <div className="flex-1 px-6 py-3 bg-yellow-500/20 border border-yellow-300/30 text-yellow-200 text-sm font-medium rounded-[10px] text-center">
                Será cancelada em {formatDate(subscription.current_period_end)}
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCanceling}
                className="flex-1 px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-medium rounded-[10px] transition-colors disabled:opacity-50"
              >
                {isCanceling ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Cancelar assinatura"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Tem certeza que deseja cancelar?
            </p>
            <p className="text-xs text-red-600 dark:text-red-300/80 mt-1">
              Você manterá acesso até o final do período atual.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                cancel();
                setShowCancelConfirm(false);
              }}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Confirmar
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="p-1.5 text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Credit Packages */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Comprar Créditos Avulsos
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
            R$ {formatPrice(EXTRA_CREDIT_PRICE)} por crédito
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl p-5 border ${
                pkg.popular
                  ? "border-primary bg-primary/5 dark:border-[#1a4fd6] dark:bg-[#1a4fd6]/10"
                  : "border-gray-200 dark:border-white/[0.08]"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-2.5 py-1 bg-primary dark:bg-[#1a4fd6] text-white text-[11px] font-semibold rounded">
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {pkg.credits}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/55">créditos</p>
              </div>

              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  R$ {formatPrice(pkg.price)}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/55">
                  R$ {formatPrice(pkg.pricePerCredit)}/crédito
                </p>
              </div>

              <button
                onClick={() => openCreditPurchaseModal(pkg.id)}
                className={`w-full mt-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pkg.popular
                    ? "bg-primary text-white hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8]"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.06]"
                }`}
              >
                Comprar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Histórico de Uso
        </h3>

        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-white/55 text-sm text-center py-8">
            Nenhuma transação ainda
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {transaction.description}
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-white/55 mt-0.5">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <p
                  className={`text-sm font-medium ${
                    transaction.type === "usage"
                      ? "text-gray-700 dark:text-white/80"
                      : "text-green-500 dark:text-emerald-400"
                  }`}
                >
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/[0.08] p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Planos Disponíveis
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/55 mt-1">
            A partir de R$ 2,30 por dia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VISIBLE_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-6 text-center ${
                  plan.highlighted
                    ? "border-2 border-primary bg-primary/[0.03] dark:border-[#1a4fd6] dark:bg-[#1a4fd6]/[0.08]"
                    : isCurrent
                      ? "border-2 border-primary dark:border-[#1a4fd6]"
                      : "border border-gray-200 dark:border-white/[0.08]"
                }`}
              >
                {plan.badge && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-2.5 py-1 bg-primary dark:bg-[#1a4fd6] text-white text-[11px] font-semibold rounded flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-2.5 py-1 bg-primary dark:bg-[#1a4fd6] text-white text-[11px] font-semibold rounded">
                      Atual
                    </span>
                  </div>
                )}

                <h4 className="text-base font-semibold text-gray-800 dark:text-white mt-2">
                  {plan.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-white/55 mt-1">
                  {plan.description}
                </p>

                <div className="mt-4">
                  <span className="text-[32px] font-bold text-gray-800 dark:text-white">
                    R$ {plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-white/55 ml-1">/mês</span>
                </div>

                <p className="text-xs text-gray-400 dark:text-white/45 mt-1">
                  {plan.credits} créditos/mês
                </p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-center gap-2 text-[13px] text-gray-500 dark:text-white/70"
                    >
                      <Check className="w-4 h-4 text-gray-700 dark:text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && openSubscribeModal(plan.id)}
                  disabled={isCurrent}
                  className={`w-full mt-5 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isCurrent
                      ? "bg-primary text-white cursor-default dark:bg-[#1a4fd6]"
                      : plan.highlighted
                        ? "bg-primary text-white hover:bg-primary-hover dark:bg-[#1a4fd6] dark:hover:bg-[#1440b8]"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/85 dark:hover:bg-white/[0.06]"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isCurrent ? "Plano atual" : "Selecionar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal((prev) => ({ ...prev, isOpen: false }))}
        mode={checkoutModal.mode}
        planId={checkoutModal.planId}
        creditPackageId={checkoutModal.creditPackageId}
        title={checkoutModal.title}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
