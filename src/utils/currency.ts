export const formatBRL = (
  value?: number | null
) => {
  return Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
};

export const formatNumber = (
  value?: number | null
) => {
  return Number(value || 0)
    .toLocaleString("pt-BR");
};

