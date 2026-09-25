/** Crisis signposting shown on every result, email and PDF (UK services). */
export const supportHeading = "If you need support right now";

export const supportLines = [
  "If you feel unable to keep yourself safe, call 999 or go to your nearest A&E.",
  "For urgent mental health help, call NHS 111 and choose the mental health option.",
  "Samaritans are there day or night, for free, on 116 123.",
  "If you would rather not talk, text SHOUT to 85258.",
];

export const reflectionDisclaimer = "This check-in is for reflection. It is not a diagnosis or a substitute for medical advice.";

export function privacyContactEmail() {
  return process.env.PRIVACY_CONTACT_EMAIL || "paula@paulasweet.co.uk";
}

export function retentionMonths() {
  const months = Number(process.env.DATA_RETENTION_MONTHS);
  return Number.isFinite(months) && months > 0 ? Math.floor(months) : 24;
}
