
import { NavLink } from "react-router-dom";

const services = [
  {
    title: "Invoice",
    description: "Create, view, and print customer invoices.",
    path: "/invoice/new-design",
    permission: "invoices",
    icon: "invoice",
  },
  {
    title: "Estimate",
    description: "Create and manage customer estimates.",
    path: "/estimate",
    permission: null,
    icon: "estimate",
  },
  {
    title: "Payment Receipt",
    description: "Generate and print customer payment receipts.",
    path: "/payment-receipt",
    permission: "invoices",
    icon: "receipt",
  },
  {
    title: "Plant Costing",
    description: "View plant costing and related calculations.",
    path: "/plant-costing",
    permission: "settings",
    icon: "plant",
  },
{
  title: "Plant Material Consumption",
  description: "Manage plant-wise material consumption and related details.",
  path: "/plant-material-consumption",
  permission: null,
  icon: "material",
},
 

{
  title: "Work Completion Report",
  path: "/work-completion-report",
  permission: null,
  icon: "agreement",
},

];

export default function CustomerService({ currentUser }) {
  const hasPermission = (permission) => {
    if (!permission) return true;
    if (currentUser?.role === "Admin") return true;
    return Boolean(currentUser?.[permission]);
  };

  const availableServices = services.filter((service) =>
    hasPermission(service.permission)
  );

  return (
    <div className="space-y-6">
      
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 sm:p-8 shadow-lg">
  <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
  <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

  <div className="relative z-10">
    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
      Customer Service
    </h1>

    <p className="mt-2 text-sm sm:text-base text-white/90">
      Manage invoices, estimates, payment receipts, plant costing, and plant material consumption.
    </p>

    <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
  </div>
</div>


      
<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
  {availableServices.map((service) => {
    const styles = {
      invoice: {
        card: "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-100 hover:border-blue-400",
        title: "text-blue-800 group-hover:text-blue-600",
        link: "text-blue-700",
        glow: "bg-blue-400/20 group-hover:bg-blue-400/40",
      },
      estimate: {
        card: "border-purple-200 bg-gradient-to-br from-violet-50 via-white to-purple-100 hover:border-purple-400",
        title: "text-purple-800 group-hover:text-purple-600",
        link: "text-purple-700",
        glow: "bg-purple-400/20 group-hover:bg-purple-400/40",
      },
      receipt: {
        card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-100 hover:border-emerald-400",
        title: "text-emerald-800 group-hover:text-emerald-600",
        link: "text-emerald-700",
        glow: "bg-emerald-400/20 group-hover:bg-emerald-400/40",
      },
      plant: {
        card: "border-orange-200 bg-gradient-to-br from-amber-50 via-white to-orange-100 hover:border-orange-400",
        title: "text-orange-800 group-hover:text-orange-600",
        link: "text-orange-700",
        glow: "bg-orange-400/20 group-hover:bg-orange-400/40",
      },
      material: {
  card: "border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-100 hover:border-teal-400",
  title: "text-teal-800 group-hover:text-teal-600",
  link: "text-teal-700",
  glow: "bg-teal-400/20 group-hover:bg-teal-400/40",
},
     
    };

    const style = styles[service.icon] || styles.invoice;

    return (
      <NavLink
        key={service.title}
        to={service.path}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${style.card}`}
      >
        <div
          className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-all ${style.glow}`}
        />

        <div className="relative z-10">
          <h2 className={`text-xl font-extrabold transition-colors ${style.title}`}>
            {service.title}
          </h2>

          <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
            {service.description}
          </p>

          <div
            className={`mt-5 inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3 ${style.link}`}
          >
            Open module
            <span aria-hidden="true">→</span>
          </div>

          <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-yellow-300 to-pink-400 transition-all duration-300 group-hover:w-20" />
        </div>
      </NavLink>
    );
  })}
</div>

    </div>
  );
}
