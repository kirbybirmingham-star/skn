const normalizeToCents = (val) => {
  if (val == null) return 0;
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Number.isInteger(n) ? Math.round(n) : Math.round(n * 100);
};

const testValues = [920, 92000, 9.2, 0.99, '920', '9.2', null, 'abc', 75, 7500];
console.log('value -> normalized cents -> formatted');
for (const v of testValues) {
  const cents = normalizeToCents(v);
  const formatted = new Intl.NumberFormat(undefined, {style: 'currency', currency: 'USD'}).format(cents / 100);
  console.log(`${String(v).padEnd(5)} -> ${String(cents).padEnd(6)} -> ${formatted}`);
}
