export default function ProjectStats({ stats }) {
  const cards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      color: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      title: "Completed",
      value: stats.completed,
      color: "border-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
    },
    {
      title: "Pending",
      value: stats.pending,
      color: "border-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    },
    {
      title: "Total Value",
      value: `₹ ${Number(stats.totalValue || 0).toLocaleString("en-IN")}`,
      color: "border-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bg} ${card.color} border-l-4 rounded-xl shadow-sm p-5`}
        >
          <p className="text-sm text-gray-500">{card.title}</p>

          <h2 className={`text-3xl font-bold mt-2 ${card.text}`}>
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}