export function calculateProfit(projects = [], payments = []) {
  const totalIncome = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const totalCost = projects.reduce(
    (sum, p) => sum + Number(p.cost_price || 0),
    0
  );

  return {
    profit: totalIncome - totalCost,
    income: totalIncome,
    cost: totalCost,
  };
}