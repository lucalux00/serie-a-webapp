export const PRO_SIGNUP_PROMO = {
  code: "signup-pro-2026",
  startsAt: "2026-08-10T00:00:00+02:00",
  endsAt: "2026-08-16T23:59:59.999+02:00",
  months: 2,
} as const;

export function isProSignupPromoActive(at: Date = new Date()) {
  const timestamp = at.getTime();
  return timestamp >= new Date(PRO_SIGNUP_PROMO.startsAt).getTime()
    && timestamp <= new Date(PRO_SIGNUP_PROMO.endsAt).getTime();
}

export function getProSignupPromoState(at: Date = new Date()) {
  return {
    ...PRO_SIGNUP_PROMO,
    active: isProSignupPromoActive(at),
  };
}
