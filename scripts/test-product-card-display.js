const formatPrice = (cents, currency = 'USD') => {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch (e) {
    return `$${(cents / 100).toFixed(2)}`;
  }
};

const getDisplayPrice = (product) => {
  const currency = product?.currency || 'USD';
  if (product?.__effective_price != null && !Number.isNaN(Number(product.__effective_price))) {
    const cents = Number(product.__effective_price);
    return formatPrice(cents, product?.currency || currency);
  }
  const firstVariant = Array.isArray(product.product_variants) && product.product_variants.length > 0
    ? product.product_variants[0]
    : null;
  const variantPrice = firstVariant && (firstVariant.price_in_cents ?? firstVariant.price ?? firstVariant.price_cents);
  if (variantPrice != null && !Number.isNaN(Number(variantPrice))) {
    const num = Number(variantPrice);
    const cents = Number.isInteger(num) ? Math.round(num) : Math.round(num * 100);
    return formatPrice(cents, product.currency || currency);
  }
  if (product.base_price != null && !Number.isNaN(Number(product.base_price))) {
    const bp = Number(product.base_price);
    const cents = Number.isInteger(bp) ? Math.round(bp) : Math.round(bp * 100);
    return formatPrice(cents, product.currency || currency);
  }
  return null;
};

const samples = [
  { id: 1, base_price: 920 },
  { id: 2, base_price: 92000 },
  { id: 3, product_variants: [{ price: 9.2 }] },
  { id: 4, product_variants: [{ price_in_cents: 920 }] },
  { id: 5, base_price: 9.2 },
  { id: 6, base_price: 75 },
  { id: 7, product_variants: [{ price: 75 }] },
  { id: 8, product_variants: [{ price: '9.2' }] },
  { id: 9, product_variants: [{ price: '920' }] },
  { id: 10, product_variants: [{ price: 920 }, { price_in_cents: 290 }] }
];

for (const s of samples) {
  console.log(`product ${s.id} -> display ${getDisplayPrice(s)}`);
}
