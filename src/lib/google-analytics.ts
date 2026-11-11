const GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{6,20}$/;

export function normalizeGoogleAnalyticsMeasurementId(value: unknown): string {
  if (typeof value !== "string") return "";

  const measurementId = value.trim().toUpperCase();
  return GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN.test(measurementId)
    ? measurementId
    : "";
}
