export const translate = (
  t: any,
  key: string,
  fallback: string
) => {
  const value = t(key);

  if (
    !value ||
    value === key ||
    value.includes(".")
  ) {
    return fallback;
  }

  return value;
};

export const safeT = (
  t: any,
  key: string,
  fallback?: string
) => {
  const value = t(key);

  if (!value || value === key) {
    return fallback || "";
  }

  return value;
};

