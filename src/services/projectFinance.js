export function calculateProjectFinance(project, payments = []) {
  const received = payments
    .filter((p) => p.project_id === project.id)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const total = Number(project.total_amount || 0);
  const pending = total - received;

  let status = "Pending";

  if (received === 0) {
    status = "Pending";
  } else if (received > 0 && received < total) {
    status = "Partially Paid";
  } else if (received >= total) {
    status = "Completed";
  }

  return {
    received,
    pending,
    status,
  };
}