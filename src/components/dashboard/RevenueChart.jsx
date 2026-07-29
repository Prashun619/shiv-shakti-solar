import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart({ monthlyRevenue }) {
  const labels = Object.keys(monthlyRevenue);
  const dataValues = Object.values(monthlyRevenue);

  const data = {
    labels,
    datasets: [
      {
        label: "Revenue (₹)",
        data: dataValues,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-3">Monthly Revenue</h2>
      <Bar data={data} />
    </div>
  );
}