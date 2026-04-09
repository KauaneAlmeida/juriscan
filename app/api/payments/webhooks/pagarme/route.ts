// Re-export webhook handler at the URL configured in Pagar.me dashboard
// Pagar.me webhook URL: https://juriscan.io/api/payments/webhooks/pagarme
export { POST, dynamic } from "@/app/api/pagarme/webhook/route";
