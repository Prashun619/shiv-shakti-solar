import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

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
  });

  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

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
        { count: customerCount },
        { data: projects },
        { data: customers },
        financeResult,
      ] = await Promise.all([
        supabase
          .from("customers")
          .select("*", {
            count: "exact",
            head: true,
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
  .select("*"),
      ]);

      const projectList = projects || [];

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

      let income = 0;
let expenses = 0;

(financeResult.data || []).forEach((item)=>{

  if(item.payment_type === "Credit"){

    income += Number(item.amount || 0);

  }


  if(item.payment_type === "Debit"){

    expenses += Number(item.amount || 0);

  }

});
      setStats({
        customers: customerCount || 0,
        projects: totalProjects,
        projectValue: totalValue,
        received: totalReceived,
        pending: totalPending,
        completed: completedProjects,
        pendingProjects,
        income,
        expenses,
        balance: income - expenses,
      });

      setRecentCustomers(customers || []);

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

  const cards = [
{
title:"Total Customers",
value:stats.customers,
icon:"👥",
color:"blue",
desc:"Registered customers"
},
{
title:"Total Projects",
value:stats.projects,
icon:"☀️",
color:"violet",
desc:"Solar installations"
},
{
title:"Completed",
value:stats.completed,
icon:"✅",
color:"green",
desc:"Completed projects"
},
{
title:"Pending",
value:stats.pendingProjects,
icon:"⏳",
color:"orange",
desc:"Work in progress"
},
{
title:"Project Value",
value:`₹ ${stats.projectValue.toLocaleString()}`,
icon:"📊",
color:"indigo",
desc:"Total project cost"
},
{
title:"Received",
value:`₹ ${stats.received.toLocaleString()}`,
icon:"💰",
color:"emerald",
desc:"Collected amount"
},
{
title:"Pending Amount",
value:`₹ ${stats.pending.toLocaleString()}`,
icon:"⚠️",
color:"red",
desc:"Outstanding"
},
];

  return (
  <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6">

{/* ================= HEADER ================= */}

<div
className="
mb-8
rounded-3xl
px-8
py-6
shadow-2xl
flex
flex-col
lg:flex-row
lg:justify-between
lg:items-center
gap-6
bg-gradient-to-r
from-slate-900
via-slate-800
to-emerald-900
border
border-slate-700
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
Shiv Shakti Solar ERP
</h1>


<p
className="
text-sm
text-emerald-200
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
bg-white/10
backdrop-blur-md
px-4
py-2
rounded-full
border
border-white/20
"
>

<span
className="
h-3
w-3
rounded-full
bg-emerald-400
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
text-slate-300
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
bg-white/95
backdrop-blur
rounded-3xl
shadow-xl
px-7
py-5
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

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card)=>(

<div
key={card.title}
className="
bg-white
rounded-2xl
shadow-sm
border
p-3
hover:shadow-lg
hover:-translate-y-1
transition
"
>

<div className="flex justify-between items-start">

<div>

<p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
{card.title}
</p>

<h2 className="text-xl font-bold text-slate-800 mt-1">
{card.value}
</h2>

<p className="text-[11px] text-slate-500 mt-1">
{card.desc}
</p>

</div>


<div className="
text-2xl
bg-slate-100
rounded-xl
p-2
">
{card.icon}
</div>


</div>

</div>

))}

    </div>

  {/* ================= QUICK ACTIONS ================= */}

<div className="mt-8">

<div className="flex items-center justify-between mb-4">

<h2 className="text-xl font-bold text-slate-800">
Quick Actions
</h2>

<span className="text-sm text-slate-500">
Frequently used actions
</span>

</div>


<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">


{/* Customer */}

<button
onClick={()=>navigate("/customers")}
className="
group
bg-gradient-to-br
from-blue-50
to-white
border
border-blue-200
rounded-3xl
p-5
shadow-sm
hover:shadow-xl
hover:-translate-y-1
transition-all
text-left
"
>

<div
className="
h-12
w-12
rounded-2xl
bg-blue-600
text-white
flex
items-center
justify-center
text-2xl
mb-4
group-hover:scale-110
transition
"
>
👥
</div>


<h3 className="
font-bold
text-slate-800
flex
justify-between
items-center
">

New Customer

<span className="text-blue-600">
→
</span>

</h3>


<p className="text-sm text-slate-500 mt-1">
Add customer details
</p>


</button>




{/* Project */}

<button
onClick={()=>navigate("/projects")}
className="
group
bg-gradient-to-br
from-green-50
to-white
border
border-green-200
rounded-3xl
p-5
shadow-sm
hover:shadow-xl
hover:-translate-y-1
transition-all
text-left
"
>


<div
className="
h-12
w-12
rounded-2xl
bg-green-600
text-white
flex
items-center
justify-center
text-2xl
mb-4
group-hover:scale-110
transition
"
>
☀️
</div>


<h3 className="
font-bold
text-slate-800
flex
justify-between
items-center
">

New Project

<span className="text-green-600">
→
</span>

</h3>


<p className="text-sm text-slate-500 mt-1">
Create solar installation
</p>


</button>





{/* Inventory */}

<button
onClick={()=>navigate("/inventory")}
className="
group
bg-gradient-to-br
from-orange-50
to-white
border
border-orange-200
rounded-3xl
p-5
shadow-sm
hover:shadow-xl
hover:-translate-y-1
transition-all
text-left
"
>


<div
className="
h-12
w-12
rounded-2xl
bg-orange-500
text-white
flex
items-center
justify-center
text-2xl
mb-4
group-hover:scale-110
transition
"
>
📦
</div>


<h3 className="
font-bold
text-slate-800
flex
justify-between
items-center
">

Inventory

<span className="text-orange-600">
→
</span>

</h3>


<p className="text-sm text-slate-500 mt-1">
Manage stock items
</p>


</button>





{/* Invoice */}

<button
onClick={()=>navigate("/invoice/new")}
className="
group
bg-gradient-to-br
from-purple-50
to-white
border
border-purple-200
rounded-3xl
p-5
shadow-sm
hover:shadow-xl
hover:-translate-y-1
transition-all
text-left
"
>


<div
className="
h-12
w-12
rounded-2xl
bg-purple-600
text-white
flex
items-center
justify-center
text-2xl
mb-4
group-hover:scale-110
transition
"
>
🧾
</div>


<h3 className="
font-bold
text-slate-800
flex
justify-between
items-center
">

Create Invoice

<span className="text-purple-600">
→
</span>

</h3>


<p className="text-sm text-slate-500 mt-1">
Generate customer invoice
</p>


</button>



</div>

</div>



    {/* ================= CUSTOMERS + PROJECTS ================= */}

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

      {/* Recent Customers Card */}

      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-sm p-6">

        <div className="flex items-center justify-between mb-5">

<div className="flex items-center gap-3">
  <div className="w-1.5 h-8 rounded-full bg-blue-600"></div>
  <h2 className="text-xl font-bold text-slate-800">
      Recent Customers
  </h2>
</div>
      

          <span className="text-sm text-gray-500">
            Last 5 Customers
          </span>

        </div>
                <div className="overflow-x-auto rounded-xl">

          <table className="w-full">

            <thead className="bg-slate-50">

<tr className="border-b border-slate-200">

                <th className="text-left py-2.5 text-sm font-semibold text-gray-600">
                  Customer
                </th>

                <th className="text-left py-2.5 text-sm font-semibold text-gray-600">
                  Location
                </th>

                <th className="text-left py-2.5 text-sm font-semibold text-gray-600">
                  Plant Size
                </th>

              </tr>

            </thead>

            <tbody>

              {recentCustomers.length > 0 ? (

                recentCustomers.map((customer, index) => (

                  <tr
                    key={index}
                    className="border-b border-slate-100 even:bg-slate-50 hover:bg-blue-50 transition-colors"
                  >

                    <td className="py-3 font-medium text-slate-800">
                      {customer.customer_name}
                    </td>

                    <td className="py-3 text-gray-600">
                      {customer.location || "-"}
                    </td>

                    <td className="py-3 text-gray-600">
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

      <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl border border-violet-200 shadow-sm p-6">

        <div className="flex items-center justify-between mb-5">

    <div className="flex items-center gap-3">
  <div className="w-1.5 h-8 rounded-full bg-violet-600"></div>
  <h2 className="text-xl font-bold text-slate-800">
      Recent Projects
  </h2>
</div>

          <span className="text-sm text-gray-500">
            Last 5 Projects
          </span>

        </div>

        <div className="overflow-x-auto rounded-xl">

          <table className="w-full">

            <thead>

              <tr className="border-b border-blue-200">

                <th className="text-left py-3 text-sm font-semibold text-gray-600">
                  Project No
                </th>

                <th className="text-left py-3 text-sm font-semibold text-gray-600">
                  Customer
                </th>

                <th className="text-left py-3 text-sm font-semibold text-gray-600">
                  Project Size
                </th>

                <th className="text-left py-3 text-sm font-semibold text-gray-600">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {recentProjects.length > 0 ? (

                recentProjects.map((project) => (

                  <tr
                    key={project.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >

                    <td className="py-3 font-medium text-slate-800">
                      {project.project_no}
                    </td>

                    <td className="py-3 text-gray-600">
                      {project.customer_name}
                    </td>

                    <td className="py-3 text-gray-600">
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

        <div className="rounded-xl bg-green-50 border border-green-200 p-5">

          <p className="text-sm font-medium text-green-700">
            Total Income
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-red-700">
            ₹ {stats.income.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-5">

          <p className="text-sm font-medium text-red-700">
            Total Expenses
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-red-700">
            ₹ {stats.expenses.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

          <p className="text-sm font-medium text-blue-700">
            Current Balance
          </p>

          <h3 className="mt-2 text-4xl font-bold tracking-tight text-blue-700">
            ₹ {stats.balance.toLocaleString()}
          </h3>

        </div>

      </div>

    </div>

  </div>
);
}