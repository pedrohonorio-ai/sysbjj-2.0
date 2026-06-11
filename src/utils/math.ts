export const safeNumber = (
  value: any
) => {
  const number = Number(value);
  if (isNaN(number)) return 0;
  return number;
};

export const safePercentage = (
  value: any
) => {
  const number = Number(value);
  if (isNaN(number)) return 0;
  return Math.min(
    100,
    Math.max(0, number)
  );
};

