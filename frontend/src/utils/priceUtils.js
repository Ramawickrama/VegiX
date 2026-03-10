export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'Rs 0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'Rs 0.00';
  return `Rs ${num.toFixed(2)}`;
};

export const formatPriceShort = (price) => {
  if (price === null || price === undefined) return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};
