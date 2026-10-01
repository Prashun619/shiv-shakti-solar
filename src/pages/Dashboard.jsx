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
  KpiCard,
} from "../components/ui";

export default function Dashboard() {

  const [stats, setStats] = useState({
    customers: 0,
    projects: 0,
    projectValue: 0,
    received: 0,
    pending: 0,
    completed: 0,
    pendingProjects: 0,

    /* OLD FINANCE VALUES */
    income: 0,
    expenses: 0,
    balance: 0,
    profit: 0,

    /* NEW FINANCE SUMMARY */
    customerPayment: 0,
    dealerPayment: 0,
    expense: 0,
    investment: 0,
    plantCost: 0,
  });

  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [currentTime, setCurrentTime] = useState("");

  /* =====================================================
     AUTH TEST
  ====================================================== */

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

  /* =====================================================
     CLOCK
  ====================================================== */

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

    const timer = setInterval(
      updateClock,
      1000
    );

    return () =>
      clearInterval(timer);

  }, []);

  const currentDate =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /* =====================================================
     LOAD DASHBOARD
  ====================================================== */

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

        /* CUSTOMERS */

        supabase
          .from("customers")
          .select("id", {
            count: "exact",
          }),

        /* PROJECTS */

        supabase
          .from("projects")
          .select("*"),

        /* RECENT CUSTOMERS */

        supabase
          .from("customers")
          .select(
            "customer_name, location, plant_size"
          )
          .order("id", {
            ascending: false,
          })
          .limit(5),

        /* BILLING / FINANCE */

        supabase
          .from("billing")
          .select("*"),

        /* PLANT COST */

        supabase
          .from("used_inventory")
          .select(
            "project_no,total_plant_cost"
          ),

        /* CUSTOMER PAYMENTS */

        supabase
          .from("payments")
          .select("*"),

      ]);

      /* =================================================
         PROJECT CALCULATIONS
      ================================================== */

      const projectList =
        projectResult.data || [];

      const totalProjects =
        projectList.length;

      const totalValue =
        projectList.reduce(
          (sum, p) =>
            sum +
            Number(
              p.total_amount || 0
            ),
          0
        );

      const totalReceived =
        projectList.reduce(
          (sum, p) =>
            sum +
            Number(
              p.received || 0
            ),
          0
        );

      const totalPending =
        projectList.reduce(
          (sum, p) =>
            sum +
            Number(
              p.remaining || 0
            ),
          0
        );

      const completedProjects =
        projectList.filter(
          (p) =>
            p.status === "Completed"
        ).length;

      const pendingProjects =
        projectList.filter(
          (p) =>
            p.status === "Pending"
        ).length;

      /* =================================================
         FINANCE DATA
      ================================================== */

      const billingList =
        financeResult.data || [];

      const paymentList =
        paymentResult.data || [];

      /* =================================================
         HELPERS
      ================================================== */

      const amountOf = (item) =>
        Number(
          item?.amount ??
          item?.payment_amount ??
          item?.total_amount ??
          0
        );

      const normalize = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();

      /* =================================================
         INVESTOR CHECK
      ================================================== */

      const investorNames = [
        "shubhendu",
        "vipin",
        "prashun",
        "saurabh",
      ];

      const isInvestor = (value) => {

        const name =
          normalize(value);

        return investorNames.some(
          (investor) =>
            name.includes(investor)
        );

      };

      /* =================================================
         TRANSACTION TYPE
      ================================================== */

      const getTransactionType = (
        item
      ) => {

        return normalize(
          item?.transaction_type ||
          item?.type ||
          item?.payment_type ||
          item?.category ||
          item?.source_type ||
          ""
        );

      };

      /* =================================================
         CUSTOMER PAYMENT
      ================================================== */

      let totalCustomerPayment = 0;

      paymentList.forEach(
        (item) => {

          const sourceType =
            normalize(
              item?.source_type
            );

          const transactionType =
            getTransactionType(item);

          /*
           * Investment-paid transactions
           * must NOT become customer payment.
           */

          if (
            sourceType ===
            "investment"
          ) {
            return;
          }

          if (
            transactionType ===
            "investment"
          ) {
            return;
          }

          totalCustomerPayment +=
            amountOf(item);

        }
      );

      /* =================================================
         FINANCE CLASSIFICATION
      ================================================== */

      let totalDealerPayment = 0;
      let totalNormalExpense = 0;
      let totalInvestment = 0;

      billingList.forEach(
        (item) => {

          const type =
            getTransactionType(item);

          const sourceType =
            normalize(
              item?.source_type
            );

          const paidBy =
            normalize(
              item?.paid_by
            );

          const company =
            normalize(
              item?.company_name
            );

          const remarks =
            normalize(
              item?.remarks
            );

          const name =
            normalize(
              item?.customer_name ||
              item?.investor_name ||
              item?.name ||
              item?.party_name
            );

          const amount =
            amountOf(item);

          /* =============================================
             CUSTOMER PAYMENT
          ============================================== */

          if (
            type ===
              "customer payment" ||
            type ===
              "customer_payment" ||
            sourceType ===
              "customer payment" ||
            sourceType ===
              "customer_payment"
          ) {

            /*
             * Already counted from payments.
             */

            return;
          }

          /* =============================================
             INVESTMENT
          ============================================== */

          if (
            type === "investment" ||
            sourceType === "investment" ||
            isInvestor(name)
          ) {

            totalInvestment +=
              amount;

            return;
          }

          /* =============================================
             DEALER PAYMENT
          ============================================== */

          const isDealerPayment =
            type ===
              "dealer payment" ||
            type ===
              "dealer_payment" ||
            type ===
              "dealer" ||
            remarks.includes(
              "dealer payment"
            );

          if (
            isDealerPayment
          ) {

            /*
             * If an investor paid the
             * dealer, FinanceLedger
             * treats it as investment.
             */

            if (
              isInvestor(
                item?.paid_by
              ) ||
              isInvestor(
                item?.investor_name
              ) ||
              isInvestor(name)
            ) {

              totalInvestment +=
                amount;

            } else {

              totalDealerPayment +=
                amount;

            }

            return;
          }

          /* =============================================
             NORMAL EXPENSE
          ============================================== */

          const isExpense =
            type === "expense" ||
            type === "vendor payment" ||
            type === "vendor_payment" ||
            type ===
              "installation charges" ||
            type ===
              "installation_charge" ||
            type === "je charge" ||
            type === "je_charge";

          if (
            isExpense
          ) {

            totalNormalExpense +=
              amount;

            return;
          }

          /*
           * Some existing billing rows may
           * have no transaction type.
           *
           * Keep them as expense because
           * billing represents outgoing
           * finance transactions in the
           * current Dashboard structure.
           */

          if (
            !type &&
            amount > 0
          ) {

            totalNormalExpense +=
              amount;

          }

        }
      );

      /* =================================================
         PLANT COST
      ================================================== */

      const usedInventoryList =
        usedInventoryResult.data || [];

      const totalPlantCost =
        usedInventoryList.reduce(
          (sum, item) =>
            sum +
            Number(
              item?.total_plant_cost ||
              0
            ),
          0
        );

      /* =================================================
         FINANCE TOTALS
      ================================================== */

      const totalIncome =
        totalCustomerPayment +
        totalInvestment;

      const totalExpenses =
        totalNormalExpense +
        totalDealerPayment;

      const netBalance =
        totalIncome -
        totalExpenses;

      /* =================================================
         TOTAL PROJECT PROFIT
      ================================================== */

      const profit =
        projectList.reduce(
          (sum, project) => {

            const inventory =
              usedInventoryList.find(
                (item) =>
                  item.project_no ===
                  project.project_no
              );

            const projectCost =
              Number(
                inventory?.total_plant_cost ||
                0
              );

            const projectValue =
              Number(
                project.total_amount ||
                0
              );

            if (
              projectCost > 0
            ) {

              return (
                sum +
                (
                  projectValue -
                  projectCost
                )
              );

            }

            return sum;

          },
          0
        );

      /* =================================================
         UPDATE STATS
      ================================================== */

      setStats({

        customers:
          customerResult.count || 0,

        projects:
          totalProjects,

        projectValue:
          totalValue,

        received:
          totalReceived,

        pending:
          totalPending,

        completed:
          completedProjects,

        pendingProjects,

        /* OLD */

        income:
          totalIncome,

        expenses:
          totalExpenses,

        balance:
          netBalance,

        profit,

        /* NEW FINANCE SUMMARY */

        customerPayment:
          totalCustomerPayment,

        dealerPayment:
          totalDealerPayment,

        expense:
          totalNormalExpense,

        investment:
          totalInvestment,

        plantCost:
          totalPlantCost,

      });

      /* =================================================
         RECENT CUSTOMERS
      ================================================== */

      setRecentCustomers(
        recentCustomerResult.data || []
      );

      /* =================================================
         RECENT PROJECTS
      ================================================== */

      await loadRecentProjects(
        projectList
      );

    } catch (err) {

      console.error(
        "Dashboard load error:",
        err
      );

    }

  }

  /* =====================================================
     RECENT PROJECTS
  ====================================================== */

  async function loadRecentProjects(
    projectList = null
  ) {

    try {

      let projects =
        projectList;

      if (!projects) {

        const { data } =
          await supabase
            .from("projects")
            .select("*")
            .order(
              "project_date",
              {
                ascending: false,
              }
            )
            .limit(5);

        projects =
          data || [];

      }

      const { data: customers } =
        await supabase
          .from("customers")
          .select(
            "id, customer_name"
          );

      const customerMap = {};

      (customers || []).forEach(
        (c) => {

          customerMap[c.id] =
            c.customer_name;

        }
      );

      const formatted =
        projects
          .sort(
            (a, b) =>
              new Date(
                b.project_date
              ) -
              new Date(
                a.project_date
              )
          )
          .slice(0, 5)
          .map(
            (p) => ({

              ...p,

              customer_name:
                customerMap[
                  p.customer_id
                ] || "-",

            })
          );

      setRecentProjects(
        formatted
      );

    } catch (err) {

      console.error(err);

    }

  }

  /* =====================================================
     FORMAT MONEY
  ====================================================== */

  const formatIndianAmount =
    (value) =>
      Number(
        value || 0
      ).toLocaleString(
        "en-IN"
      );

  /* =====================================================
     RETURN
  ====================================================== */

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 text-slate-800">

      {/* =================================================
          CONTENT
      ================================================== */}

      <div
        className="
          relative
        "
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
  mb-6
  rounded-2xl
  border
  border-blue-700
  bg-gradient-to-r
  from-blue-400
  via-white
  to-purple-400
  px-5
  py-4
  shadow-md
  flex
  flex-col
  lg:flex-row
  lg:justify-between
  lg:items-center
  gap-5
"
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-5
              "
            >

              <div
                className="
                  h-16
                  w-16
                  rounded-2xl
                  border
                  border-blue-200
                  bg-gradient-to-br
                  from-blue-50
                  to-cyan-50
                  flex
                  items-center
                  justify-center
                  shadow-sm
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
                    font-black
                    tracking-tight
                    text-slate-800
                  "
                >
                  Shiv Shakti Solar
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-red-500
                  "
                >
                  Smart Renewable Energy Management System
                </p>

              </div>

            </div>

            <div
              className="
                mt-5
                inline-flex
                items-center
                gap-3
                rounded-full
                border
                border-emerald-200
                bg-emerald-50
                px-4
                py-1.5
              "
            >

              <span
                className="
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-emerald-500
                  animate-pulse
                "
              />

              <span
                className="
                  text-sm
                  font-bold
                  text-emerald-700
                "
              >
                System Online
              </span>

              <span
                className="
                  text-sm
                  text-slate-300
                "
              >
                •
              </span>

              <span
                className="
                  text-sm
                  text-slate-500
                "
              >
                Dashboard Overview
              </span>

            </div>

          </div>

          {/* DATE / TIME */}

          <div
            className="
              min-w-[300px]
              rounded-2xl
              border
              border-blue-200
              bg-gradient-to-br
                  from-blue-50
                  to-cyan-50
              bg-slate-50
              px-5
              py-4
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-8
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.25em]
                    font-bold
                    text-blue-600
                  "
                >
                  Today
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  {currentDate}
                </p>

              </div>

              <div
                className="text-right"
              >

                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.25em]
                    font-bold
                    text-purple-600
                  "
                >
                  Current Time
                </p>

                <h2
                  className="
                    text-3xl
                    font-black
                    text-blue-600
                  "
                >
                  {currentTime}
                </h2>

              </div>

            </div>

            <div
              className="
                mt-4
                border-t
                border-slate-200
                pt-3
                flex
                items-center
                gap-2
                text-sm
                text-slate-500
              "
            >

              <span
                className="text-blue-600"
              >
                👤
              </span>

              <span>
                Welcome back,
              </span>

              <span
                className="
                  font-bold
                  text-slate-800
                "
              >
                Admin
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            MAIN KPI CARDS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-5
          "
        >

          <div>
            <KpiCard
              title="Total Customers"
              value={stats.customers}
              icon={
                <Users
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Registered Customers"
              color="purple"
            />
          </div>

          <div>
            <KpiCard
              title="Total Projects"
              value={stats.projects}
              icon={
                <FolderKanban
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Solar Installations"
              color="blue"
            />
          </div>

          <div>
            <KpiCard
              title="Completed"
              value={stats.completed}
              icon={
                <CircleCheckBig
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Completed Projects"
              color="green"
            />
          </div>

          <div>
            <KpiCard
              title="Pending"
              value={stats.pendingProjects}
              icon={
                <AlertTriangle
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Pending Projects"
              color="orange"
            />
          </div>

          <div>
            <KpiCard
              title="Project Value"
              value={
                `₹ ${formatIndianAmount(
                  stats.projectValue
                )}`
              }
              icon={
                <IndianRupee
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Total Project Value"
              color="purple"
            />
          </div>

          <div>
            <KpiCard
              title="Received"
              value={
                `₹ ${formatIndianAmount(
                  stats.received
                )}`
              }
              icon={
                <Wallet
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Payments Received"
              color="green"
            />
          </div>

          <div>
            <KpiCard
              title="Pending Amount"
              value={
                `₹ ${formatIndianAmount(
                  stats.pending
                )}`
              }
              icon={
                <Clock3
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Outstanding Payments"
              color="red"
              trend="down"
            />
          </div>

          <div>
            <KpiCard
              title="Profit"
              value={
                `₹ ${formatIndianAmount(
                  stats.profit
                )}`
              }
              icon={
                <TrendingUp
                  size={30}
                  strokeWidth={2.2}
                />
              }
              subtitle="Overall Business Profit"
              color="green"
            />
          </div>

        </div>

        {/* =================================================
            FINANCE SUMMARY
        ================================================== */}

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-blue-100
                  bg-gradient-to-br
                  from-purple-100
                  to-cyan-100
                  
            bg-white
            p-6
            shadow-md
          "
        >

          {/* TITLE */}

          <div
            className="
              flex
              items-center
              justify-between
              mb-6
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-black
                  text-slate-800
                "
              >
                Finance Summary
              </h2>

              <div
                className="
                  mt-1
                  h-1
                  w-20
                  rounded-full
                  bg-gradient-to-r
                  from-blue-500
                  via-purple-500
                  to-pink-500
                "
              />

            </div>

            <span
              className="
                text-sm
                text-slate-400
              "
            >
              Overall Financial Overview
            </span>

          </div>

          {/* =================================================
              5 FINANCE CARDS
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-5
              gap-3
            "
          >

            {/* =================================================
                CUSTOMER PAYMENT
            ================================================== */}

            <div
              className="
                group
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-2
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-100
                  text-emerald-600
                "
              >
                <IndianRupee size={18} />
              </div>

              <p
                className="
                  text-xs
                  font-bold
                  text-emerald-700
                  truncate
                "
              >
                Customer Payment
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-500
                  truncate
                "
              >
                All customer payments
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-black
                  text-emerald-700
                  truncate
                "
              >
                ₹ {formatIndianAmount(stats.customerPayment)}
              </h3>

            </div>

            {/* =================================================
                PLANT COST
            ================================================== */}

            <div
              className="
                group
                rounded-2xl
                border
                border-cyan-200
                bg-cyan-50
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-2
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-cyan-100
                  text-cyan-600
                "
              >
                <IndianRupee size={18} />
              </div>

              <p
                className="
                  text-xs
                  font-bold
                  text-cyan-700
                  truncate
                "
              >
                Plant Cost
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-500
                  truncate
                "
              >
                Total plant expenses
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-black
                  text-cyan-700
                  truncate
                "
              >
                ₹ {formatIndianAmount(stats.plantCost)}
              </h3>

            </div>

            {/* =================================================
                DEALER PAYMENT
            ================================================== */}

            <div
              className="
                group
                rounded-2xl
                border
                border-rose-200
                bg-rose-50
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-2
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-100
                  text-rose-600
                "
              >
                <Wallet size={18} />
              </div>

              <p
                className="
                  text-xs
                  font-bold
                  text-rose-700
                  truncate
                "
              >
                Dealer Payment
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-500
                  truncate
                "
              >
                Payments made by Shiv Shakti Solar
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-black
                  text-rose-700
                  truncate
                "
              >
                ₹ {formatIndianAmount(stats.dealerPayment)}
              </h3>

            </div>

            {/* =================================================
                EXPENSE
            ================================================== */}

            <div
              className="
                group
                rounded-2xl
                border
                border-orange-200
                bg-orange-50
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-2
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-100
                  text-orange-600
                "
              >
                <TrendingUp size={18} />
              </div>

              <p
                className="
                  text-xs
                  font-bold
                  text-orange-700
                  truncate
                "
              >
                Expense
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-500
                  truncate
                "
              >
                Normal expenses and vendor payments
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-black
                  text-orange-700
                  truncate
                "
              >
                ₹ {formatIndianAmount(stats.expense)}
              </h3>

            </div>

            {/* =================================================
                INVESTMENT
            ================================================== */}

            <div
              className="
                group
                rounded-2xl
                border
                border-purple-200
                bg-purple-50
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-2
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-purple-100
                  text-purple-600
                "
              >
                <IndianRupee size={18} />
              </div>

              <p
                className="
                  text-xs
                  font-bold
                  text-purple-700
                  truncate
                "
              >
                Investment
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-slate-500
                  truncate
                "
              >
                Investments and investor payments
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-black
                  text-purple-700
                  truncate
                "
              >
                ₹ {formatIndianAmount(stats.investment)}
              </h3>

            </div>

          </div>

        </div>

        {/* =================================================
            RECENT CUSTOMERS + PROJECTS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-2
            gap-6
            mt-6
          "
        >

          {/* =================================================
              RECENT CUSTOMERS
          ================================================== */}

          <div
            className="
              rounded-2xl
              border
              border-blue-200
              bg-white
              p-6
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-lg
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                mb-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    h-9
                    w-1
                    rounded-full
                    bg-blue-500
                  "
                />

                <h2
                  className="
                    text-xl
                    font-black
                    text-slate-800
                  "
                >
                  Recent Customers
                </h2>

              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  text-blue-500
                "
              >
                Last 5 Customers
              </span>

            </div>

            <div
              className="
                overflow-x-auto
                rounded-2xl
                border
                border-slate-200
              "
            >

              <table
                className="w-full"
              >

                <thead
                  className="
                    bg-blue-50
                  "
                >

                  <tr
                    className="
                      border-b
                      border-blue-100
                    "
                  >

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-blue-600
                      "
                    >
                      Customer
                    </th>

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-blue-600
                      "
                    >
                      Location
                    </th>

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-blue-600
                      "
                    >
                      Plant Size
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentCustomers.length >
                  0 ? (

                    recentCustomers.map(
                      (
                        customer,
                        index
                      ) => (

                        <tr
                          key={index}
                          className="
                            border-b
                            border-slate-100
                            transition-all
                            duration-200
                            hover:bg-blue-50
                          "
                        >

                          <td
                            className="
                              px-4
                              py-3
                              font-semibold
                              text-slate-800
                            "
                          >
                            {
                              customer.customer_name
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-sm
                              text-slate-600
                            "
                          >
                            {
                              customer.location ||
                              "-"
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-sm
                              font-semibold
                              text-blue-600
                            "
                          >
                            {
                              customer.plant_size ||
                              "-"
                            }{" "}
                            kW
                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={3}
                        className="
                          py-8
                          text-center
                          text-slate-500
                        "
                      >
                        No customers found
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* =================================================
              RECENT PROJECTS
          ================================================== */}

          <div
            className="
              rounded-2xl
              border
              border-purple-200
              bg-white
              p-6
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-lg
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                mb-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    h-9
                    w-1
                    rounded-full
                    bg-purple-500
                  "
                />

                <h2
                  className="
                    text-xl
                    font-black
                    text-slate-800
                  "
                >
                  Recent Projects
                </h2>

              </div>

              <span
                className="
                  text-xs
                  font-semibold
                  text-purple-500
                "
              >
                Last 5 Projects
              </span>

            </div>

            <div
              className="
                overflow-x-auto
                rounded-2xl
                border
                border-slate-200
              "
            >

              <table
                className="w-full"
              >

                <thead
                  className="
                    bg-purple-50
                  "
                >

                  <tr
                    className="
                      border-b
                      border-purple-100
                    "
                  >

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-purple-600
                      "
                    >
                      Project No
                    </th>

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-purple-600
                      "
                    >
                      Customer
                    </th>

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-purple-600
                      "
                    >
                      Project Size
                    </th>

                    <th
                      className="
                        text-left
                        px-4
                        py-3
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-purple-600
                      "
                    >
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentProjects.length >
                  0 ? (

                    recentProjects.map(
                      (project) => (

                        <tr
                          key={
                            project.id
                          }
                          className="
                            border-b
                            border-slate-100
                            transition-all
                            duration-200
                            hover:bg-purple-50
                          "
                        >

                          <td
                            className="
                              px-4
                              py-3
                              font-semibold
                              text-slate-800
                            "
                          >
                            {
                              project.project_no
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-sm
                              text-slate-600
                            "
                          >
                            {
                              project.customer_name
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-sm
                              font-semibold
                              text-purple-600
                            "
                          >
                            {
                              project.project_size
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <span
                              className={`
                                inline-flex
                                items-center
                                rounded-full
                                border
                                px-3
                                py-1
                                text-[11px]
                                font-bold
                                ${
                                  project.status ===
                                  "Completed"
                                    ? `
                                      border-emerald-200
                                      bg-emerald-50
                                      text-emerald-700
                                    `
                                    : project.status ===
                                      "Pending"
                                    ? `
                                      border-orange-200
                                      bg-orange-50
                                      text-orange-700
                                    `
                                    : `
                                      border-blue-200
                                      bg-blue-50
                                      text-blue-700
                                    `
                                }
                              `}
                            >

                              <span
                                className={`
                                  mr-2
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  ${
                                    project.status ===
                                    "Completed"
                                      ? "bg-emerald-500"
                                      : project.status ===
                                        "Pending"
                                      ? "bg-orange-500"
                                      : "bg-blue-500"
                                  }
                                `}
                              />

                              {
                                project.status
                              }

                            </span>

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={4}
                        className="
                          py-8
                          text-center
                          text-slate-500
                        "
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

    </div>

  );
}