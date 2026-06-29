import { requiredDownPayment, RequiredDownPaymentInput } from "./requiredDownPayment";

/**
 * Down payment suggested when the LTV rule requires none (100% LTV): even
 * though banks allow 0% down during the relaxation (or for a first home), a
 * small down payment is almost always wiser — it lowers the loan, total
 * interest, and monthly payment, and leaves cash for transfer-day fees.
 */
export const NO_LTV_DOWN_PAYMENT_FRACTION = 0.05;

/**
 * The down payment to pre-fill into the form: the LTV-required minimum, or — when
 * the rule requires nothing (100% LTV) — `NO_LTV_DOWN_PAYMENT_FRACTION` of the
 * home price. Callers still cap this at the user's savings.
 *
 * Distinct from `requiredDownPayment` (the hard rule, shown in the result card):
 * this is only the smart default for the input field.
 */
export function suggestedDownPayment(input: RequiredDownPaymentInput): number {
  const required = requiredDownPayment(input);
  if (required > 0) {
    return required;
  }
  return Math.round(input.homePrice * NO_LTV_DOWN_PAYMENT_FRACTION);
}
