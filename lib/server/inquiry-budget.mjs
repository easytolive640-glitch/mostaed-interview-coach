// Upper-bound reservations, not estimates of actual invoiced spend.
// Standard GPT-4.1 mini prices verified 2026-10-30: $0.40/$1.60 per 1M tokens.
// 12,000 UTF-8 prompt bytes + 1,024 framing tokens + 300 output tokens
// cost <= $0.0056896. Reserve $0.01 per attempt, without refunds or retries.
export const inquiryBudget = Object.freeze({
  monthlyUsd: 5,
  reservationMicroUsd: 10000,
  maxPromptBytes: 12000,
  maxOutputTokens: 300,
  model: 'gpt-4.1-mini-2025-04-14',
});
export function boundedInquiryRequest(instructions, input) {
  const model = process.env.INQUIRY_MODEL || inquiryBudget.model;
  if (![inquiryBudget.model, 'gpt-4.1-mini'].includes(model) ||
      Buffer.byteLength(instructions + input, 'utf8') > inquiryBudget.maxPromptBytes) return null;
  return {model: inquiryBudget.model, service_tier: 'default', store: false,
    max_output_tokens: inquiryBudget.maxOutputTokens, instructions, input};
}
