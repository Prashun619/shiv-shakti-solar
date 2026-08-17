import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

import {
  Users,
  FolderKanban,
  IndianRupee,
  Wallet,
  Clock3,
  CircleCheckBig,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  KpiCard,
  PageHeader,
  Badge,
} from "../components/ui";

export default function Dashboard() {
  const navigate = useNavigate();
 const [stats, setStats] = useState({
    customers: 0,
    projects: 0,
    projectValue: 0,
    received: 0,
    pending: 0,
    completed: 0,
    pendingProjects: 0,
    income: 0,
    expenses: 0,
    balance: 0,
    profit: 0,
});

  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

useEffect(() => {

  async function testAuth() {

    const { data, error } =
      await supabase.rpc("who_am_i");

    console.log("WHO AM I:", data);

    console.log("ERROR:", error);

    const {
  data: {
    user: authUser,
  },
} = await supabase.auth.getUser();

console.log(
  "AUTH USER ID:",
  authUser?.id
);

console.log(
  "AUTH USER EMAIL:",
  authUser?.email
);

  }

  

  testAuth();

}, []);

  /* ---------------- CLOCK ---------------- */

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };

    updateClock();

    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
  
      const [
  customerResult,
  projectResult,
  recentCustomerResult,
  financeResult,
  usedInventoryResult,
  paymentResult,
] = await Promise.all([

        supabase
  .from("customers")
  .select("id", {
    count: "exact",
  }),

       supabase
.from("projects")
.select("*"),

supabase
  .from("customers")
  .select(
    "customer_name, location, plant_size"
  )
  .order("id", {
    ascending: false,
  })
  .limit(5),

        supabase
  .from("billing")
  .select("amount"),

  supabase
.from("used_inventory")
.select("project_no,total_plant_cost"),

supabase
.from("payments")
.select("amount"),

      ]);

      const projectList = projectResult.data || [];

      const totalProjects = projectList.length;

      const totalValue = projectList.reduce(
        (sum, p) => sum + Number(p.total_amount || 0),
        0
      );

      const totalReceived = projectList.reduce(
        (sum, p) => sum + Number(p.received || 0),
        0
      );

      const totalPending = projectList.reduce(
        (sum, p) => sum + Number(p.remaining || 0),
        0
      );

      const completedProjects = projectList.filter(
        (p) => p.status === "Completed"
      ).length;

      const pendingProjects = projectList.filter(
        (p) => p.status === "Pending"
      ).length;

    let expenses = (financeResult.data || []).reduce(
  (sum, item) => sum + Number(item.amount || 0),
  0
);

const income = (paymentResult.data || []).reduce(
  (sum, item) =>
    sum + Number(item.amount || 0),
  0
);
const balance = income - expenses;


      
      // TOTAL PROJECT PROFIT
const usedInventoryList = usedInventoryResult.data || [];

const profit = projectList.reduce(
  (sum, project) => {

    const inventory = usedInventoryList.find(
      (item) =>
        item.project_no === project.project_no
    );

    const projectCost = Number(
      inventory?.total_plant_cost || 0
    );

    const projectValue = Number(
      project.total_amount || 0
    );

    if(projectCost > 0){

  return sum + (projectValue - projectCost);

}

return sum;

  },
  0
);


setStats({
  customers: customerResult.count || 0,
  projects: totalProjects,
  projectValue: totalValue,
  received: totalReceived,
  pending: totalPending,
  completed: completedProjects,
  pendingProjects,
  income,
  expenses,
  balance,
  profit,
});

      setRecentCustomers(
  recentCustomerResult.data || []
);

      await loadRecentProjects(projectList);

    } catch (err) {
      console.error(err);
    }
  }

  async function loadRecentProjects(projectList = null) {
    try {
      let projects = projectList;

      if (!projects) {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .order("project_date", {
            ascending: false,
          })
          .limit(5);

        projects = data || [];
      }

      const { data: customers } = await supabase
        .from("customers")
        .select("id, customer_name");

      const customerMap = {};

      (customers || []).forEach((c) => {
        customerMap[c.id] = c.customer_name;
      });

      const formatted = projects
        .sort(
          (a, b) =>
            new Date(b.project_date) -
            new Date(a.project_date)
        )
        .slice(0, 5)
        .map((p) => ({
          ...p,
          customer_name:
            customerMap[p.customer_id] || "-",
        }));

      setRecentProjects(formatted);

    } catch (err) {
      console.error(err);
    }
  }

 

  return (
  <div className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-100 p-6">

{/* ================= HEADER ================= */}

<div
className="
mb-6
rounded-3xl
px-5
py-3
shadow-2xl
flex
flex-col
lg:flex-row
lg:justify-between
lg:items-center
gap-4
bg-gradient-to-r
from-cyan-600
via-teal-600
to-emerald-500
border
border-white/20
"
>

{/* LEFT SECTION */}

<div>

<div className="flex items-center gap-5">


{/* Logo */}

<div
className="
h-16
w-16
rounded-2xl
bg-white
flex
items-center
justify-center
shadow-xl
ring-4
ring-white/20
"
>

<img
src="/logo.png"
alt="Shiv Shakti Solar"
className="
h-14
w-14
object-contain
"
/>

</div>



<div>

<h1
className="
text-3xl
font-bold
text-white
tracking-tight
"
>
Shiv Shakti Solar
</h1>


<p
className="
text-sm
text-white/80
mt-1
"
>
Smart Renewable Energy Management System
</p>


</div>


</div>



{/* Status */}

<div
className="
mt-5
inline-flex
items-center
gap-3
bg-emerald-500/20
backdrop-blur-md
px-3
py-1
rounded-full
border
border-emerald-300/30
shadow-lg
"
>

<span
className="
h-3
w-3
rounded-full
bg-emerald-300
animate-pulse
shadow-lg
"
>
</span>


<span
className="
text-white
text-sm
font-semibold
"
>
System Online
</span>


<span
className="
text-emerald-100
text-sm
"
>
•
 Dashboard Overview
</span>


</div>


</div>




{/* RIGHT SECTION */}

<div
className="
bg-white/90
backdrop-blur-xl
rounded-3xl
shadow-xl
px-5
py-3
min-w-[280px]
"
>


<div
className="
flex
justify-between
items-center
"
>


<div>

<p
className="
text-xs
uppercase
tracking-widest
text-slate-400
font-semibold
"
>
Today
</p>


<p
className="
text-sm
font-bold
text-slate-700
mt-1
"
>
{currentDate}
</p>


</div>



<div
className="
text-right
"
>

<p
className="
text-xs
uppercase
tracking-widest
text-slate-400
font-semibold
"
>
Current Time
</p>


<h2
className="
text-3xl
font-bold
text-emerald-700
"
>
{currentTime}
</h2>


</div>


</div>



<div
className="
mt-4
pt-3
border-t
border-slate-200
text-sm
text-slate-600
flex
items-center
gap-2
"
>

<span>
👤
</span>

Welcome back, Admin


</div>


</div>


</div>

      

{/* ================= KPI CARDS ================= */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

  <KpiCard
    title="Total Customers"
    value={stats.customers}
    icon={<Users size={30} strokeWidth={2.2} />}
    subtitle="Registered Customers"
    color="purple"
  />

  <KpiCard
    title="Total Projects"
    value={stats.projects}
    icon={<FolderKanban size={30} strokeWidth={2.2} />}
    subtitle="Solar Installations"
    color="blue"
  />

  <KpiCard
    title="Completed"
    value={stats.completed}
    icon={<CircleCheckBig size={30} strokeWidth={2.2} />}
    subtitle="Completed Projects"
    color="green"
  />

  <KpiCard
    title="Pending"
    value={stats.pendingProjects}
    icon={<AlertTriangle size={30} strokeWidth={2.2} />}
    subtitle="Pending Projects"
    color="orange"
  />

  <KpiCard
    title="Project Value"
    value={`₹ ${stats.projectValue.toLocaleString()}`}
    icon={<IndianRupee size={30} strokeWidth={2.2} />}
    subtitle="Total Project Value"
    color="purple"
  />

  <KpiCard
    title="Received"
    value={`₹ ${stats.received.toLocaleString()}`}
    icon={<Wallet size={30} strokeWidth={2.2} />}
    subtitle="Payments Received"
    color="green"
  />

  <KpiCard
    title="Pending Amount"
    value={`₹ ${stats.pending.toLocaleString()}`}
    icon={<Clock3 size={30} strokeWidth={2.2} />}
    subtitle="Outstanding Payments"
    color="red"
    trend="down"
  />

<KpiCard
  title="Profit"
  value={`₹ ${stats.profit.toLocaleString()}`}
  icon={<TrendingUp size={30} strokeWidth={2.2} />}
  color="green"
  subtitle="Overall Business Profit"
/>

</div>

 {/* ================= FINANCE SUMMARY ================= */}

    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-sm p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold text-slate-800">
          Finance Summary
        </h2>

        <span className="text-sm text-gray-500">
          Overall Financial Overview
        </span>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-blue-700 p-5 text-white shadow-lg">

          <p className="text-sm font-medium text-white/90">
            Total Income
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
            ₹ {stats.income.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-xl bg-gradient-to-br from-rose-500 to-red-700 p-5 text-white shadow-lg">

          <p className="text-sm font-medium text-white/90">
            Total Expenses
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
            ₹ {stats.expenses.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-xl bg-gradient-to-br from-sky-500 to-teal-700 p-5 text-white shadow-lg">

          <p className="text-sm font-medium text-white/90">
            Current Balance
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
            ₹ {stats.balance.toLocaleString()}
          </h3>

        </div>
        </div>
</div>

    {/* ================= CUSTOMERS + PROJECTS ================= */}

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

      {/* Recent Customers Card */}

      <div className="bg-gradient-to-br from-sky-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">

        <div className="flex items-center justify-between mb-5">

<div className="flex items-center gap-3">
  <div className="w-1.5 h-8 rounded-full bg-white"></div>
  <h2 className="text-xl font-bold text-white">
      Recent Customers
  </h2>
</div>
      

          <span className="text-sm text-bold text-white/80">
  Last 5 Customers
</span>

        </div>
                <div className="overflow-x-auto rounded-xl">

          <table className="w-full">

            <thead className="bg-white/10">

<tr className="border-b border-slate-200">

                <th className="text-left py-2.5 text-sm font-bold text-white/90">
                  Customer
                </th>

                <th className="text-left py-2.5 text-sm font-bold text-white/90">
                  Location
                </th>

                <th className="text-left py-2.5 text-sm font-bold text-white/90">
                  Plant Size
                </th>

              </tr>

            </thead>

            <tbody>

              {recentCustomers.length > 0 ? (

                recentCustomers.map((customer, index) => (

                  <tr
                    key={index}
                    className="border-b border-white/20 even:bg-white/10 hover:bg-white/20 transition-colors"
                  >

                    <td className="py-3 font-medium text-semibold text-white">
                      {customer.customer_name}
                    </td>

                    <td className="py-3 text-semibold text-white/80">
                      {customer.location || "-"}
                    </td>

                    <td className="py-3 text-semibold text-white/80">
                      {customer.plant_size || "-"} kW
                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={3}
                    className="py-8 text-center text-gray-400"
                  >
                    No customers found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>
            {/* Recent Projects Card */}

      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">

        <div className="flex items-center justify-between mb-5">

    <div className="flex items-center gap-3">
  <div className="w-1.5 h-8 rounded-full bg-white"></div>
  <h2 className="text-xl font-bold text-white">
  Recent Projects
</h2>
</div>

          <span className="text-sm text-white/80">
  Last 5 Projects
</span>

        </div>

        <div className="overflow-x-auto rounded-xl">

          <table className="w-full">

            <thead className="bg-white/10">

              <tr className="border-b border-blue-200">

                <th className="text-left py-3 text-sm font-semibold text-white/90">
                  Project No
                </th>

                <th className="text-left py-3 text-sm font-semibold text-white/90">
                  Customer
                </th>

                <th className="text-left py-3 text-sm font-semibold text-white/90">
                  Project Size
                </th>

                <th className="text-left py-3 text-sm font-semibold text-white/90">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {recentProjects.length > 0 ? (

                recentProjects.map((project) => (

                  <tr
                    key={project.id}
                    className="border-b border-white/20 hover:bg-white/10 transition"
                  >

                    <td className="py-3 font-medium text-white">
                      {project.project_no}
                    </td>

                    <td className="py-3 text-white/80">
                      {project.customer_name}
                    </td>

                    <td className="py-3 text-white/80">
                      {project.project_size}
                    </td>

                    <td className="py-3">

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold rounded-full text-xs font-semibold ${
                          project.status === "Completed"
                            ? "bg-green-100 text-red-700"
                            : project.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {project.status}
                      </span>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400"
                  >
                    No projects found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
        

      </div>

    
);
}