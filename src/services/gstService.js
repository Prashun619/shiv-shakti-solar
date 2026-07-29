export function calculateGST(amount, rate = 18) {
  const cgst = (amount * rate) / 200;
  const sgst = (amount * rate) / 200;

  return {
    cgst,
    sgst,
    totalGST: cgst + sgst,
  };
}