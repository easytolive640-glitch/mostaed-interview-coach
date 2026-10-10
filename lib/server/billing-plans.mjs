export const billingPlans = Object.freeze({
  starter: { amount: 3.99, questions: 10, limit: 20, env: 'PAYPAL_STARTER_PLAN_ID' },
  pro: { amount: 7.99, questions: 15, limit: 100, env: 'PAYPAL_PRO_PLAN_ID' },
});
export const paypalPlanId = plan => process.env[billingPlans[plan]?.env] || null;
export function subscriptionPlan(subscription) {
  return Object.keys(billingPlans).find(plan => paypalPlanId(plan) && subscription?.plan_id === paypalPlanId(plan)) || null;
}
