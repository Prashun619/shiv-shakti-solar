export function calculateDashboardData(
  projects = [],
  payments = [],
  customers = [],
  usedInventory = []
) {

  // TOTAL RECEIVED
  const totalReceived = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // TOTAL PROJECT VALUE
  const totalProjectValue = projects.reduce(
    (sum, p) => sum + Number(p.total_amount || 0),
    0
  );

  // TOTAL PROJECT COST
const totalProjectCost = usedInventory.reduce(
  (sum, item) =>
    sum + Number(item.total_plant_cost || 0),
  0
);


// TOTAL PROFIT
const totalProfit =
  totalProjectValue - totalProjectCost;

  // PENDING AMOUNT
  const totalPending = totalProjectValue - totalReceived;

  // PROJECT STATUS COUNTS
  const completed = projects.filter((p) => p.status === "Completed").length;
  const pending = projects.filter((p) => p.status === "Pending").length;
  const active = projects.filter((p) => p.status === "Active").length;

  // COLLECTION RATE
  const collectionRate =
    totalProjectValue > 0
      ? (totalReceived / totalProjectValue) * 100
      : 0;

  // MONTHLY REVENUE MAP
  const monthlyRevenue = {};

  payments.forEach((p) => {
    const date = new Date(p.payment_date);
    const month = date.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    monthlyRevenue[month] =
      (monthlyRevenue[month] || 0) + Number(p.amount || 0);
  });

  // TOP CUSTOMERS BY PAYMENTS
  const customerMap = {};

  payments.forEach((p) => {
    customerMap[p.customer_id] =
      (customerMap[p.customer_id] || 0) + Number(p.amount || 0);
  });

  const topCustomers = Object.entries(customerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([customer_id, total]) => {
      const customer = customers.find((c) => c.id === customer_id);

      return {
        name: customer?.customer_name || "Unknown",
        total,
      };
    });

  return {
  totalReceived,
  totalProjectValue,
  totalProjectCost,
  totalProfit,
  totalPending,
  completed,
  pending,
  active,
  collectionRate,
  monthlyRevenue,
  topCustomers,
};

}