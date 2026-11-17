
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  ArrowLeft,
  Save,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "../services/supabase";
import { getCustomers } from "../services/customersService";
import { getProjects } from "../services/projectsService";
import { getInventoryProducts } from "../services/inventoryService";

export default function PlantMaterialConsumption() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [editingEntryId, setEditingEntryId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [plantSize, setPlantSize] = useState("");
  const [location, setLocation] = useState("");
  const [quantities, setQuantities] = useState({});
  const [units, setUnits] = useState({});

  // =====================================================
  // LOAD CUSTOMERS, PROJECTS, INVENTORY AND SAVED ENTRIES
  // =====================================================

  async function loadData() {
    try {
      setLoading(true);

      const [
        customerData,
        projectData,
        inventoryData,
        { data: consumptionData, error },
      ] = await Promise.all([
        getCustomers(),
        getProjects(),
        getInventoryProducts(),
        supabase
          .from("plant_material_consumption")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (error) throw error;

      // Only customers having a project with received amount exactly 0.
      const eligibleCustomers = (customerData || [])
        .map((customer) => {
          const project = (projectData || []).find(
            (item) => String(item.customer_id) === String(customer.id)
          );

          return { ...customer, project };
        })
        .filter(
          (customer) =>
            customer.project &&
            customer.project.received !== null &&
            customer.project.received !== undefined &&
            Number(customer.project.received) === 0
        )
        .sort(
          (a, b) =>
            new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );

      // Keep distinct product/category combinations.
      const uniqueProducts = new Map();

      (inventoryData || []).forEach((item) => {
        const name = String(item.product_name || "").trim();
        const category = String(item.category || "").trim();

        if (!name) return;

        const key = `${name.toLowerCase()}__${category.toLowerCase()}`;

        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, {
            product_name: name,
            category,
          });
        }
      });

      const sortedProducts = Array.from(uniqueProducts.values()).sort(
        (a, b) => a.product_name.localeCompare(b.product_name)
      );

      setCustomers(eligibleCustomers);
      setProducts(sortedProducts);
      setEntries(consumptionData || []);
    } catch (error) {
      console.error("PLANT MATERIAL CONSUMPTION LOAD ERROR:", error);
      alert(error.message || "Unable to load material consumption data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // PRODUCT UNIT RULES
  // =====================================================

  function getProductUnit(productName) {
    const name = String(productName || "").toLowerCase();

    if (name.includes("wire")) {
      return "wire";
    }

    if (
      name === "c channel 140x50x2 mm 9ft" ||
      name === "c channel 140x50x2 mm 21ft"
    ) {
      return "Ft";
    }

    return "Nos";
  }

  // =====================================================
  // CUSTOMER SELECTION
  // =====================================================

  function handleCustomerChange(customerId) {
    setSelectedCustomer(customerId);

    const customer = customers.find(
      (item) => String(item.id) === String(customerId)
    );

    if (!customer) {
      setPlantSize("");
      setLocation("");
      return;
    }

    setPlantSize(
      customer.plant_size ||
      customer.project?.project_size ||
      ""
    );

    setLocation(customer.location || "");
  }

  // =====================================================
  // QUANTITY AND UNIT HANDLERS
  // =====================================================

  function handleQuantityChange(productKey, value) {
    setQuantities((previous) => ({
      ...previous,
      [productKey]: value,
    }));
  }

  function handleUnitChange(productKey, value) {
    setUnits((previous) => ({
      ...previous,
      [productKey]: value,
    }));
  }

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setSelectedCustomer("");
    setPlantSize("");
    setLocation("");
    setQuantities({});
    setUnits({});
  }

  function handleEdit(entry) {
  setEditingEntryId(entry.id);

  setSelectedCustomer(String(entry.customer_id));
  setPlantSize(entry.plant_size || "");
  setLocation(entry.location || "");

  const savedQuantities = {};
  const savedUnits = {};

  (entry.products || []).forEach((product) => {
    const key = `${product.product_name}__${product.category || ""}`;

    savedQuantities[key] = String(product.qty_used);

    if (product.unit) {
      savedUnits[key] = product.unit;
    }
  });

  setQuantities(savedQuantities);
  setUnits(savedUnits);
  setShowForm(true);
}

async function handleDelete(id) {
  if (!window.confirm("Are you sure you want to delete this entry?")) {
    return;
  }

  try {
    const { error } = await supabase
      .from("plant_material_consumption")
      .delete()
      .eq("id", id);

    if (error) throw error;

    alert("Material consumption deleted successfully.");

    await loadData();
  } catch (error) {
    console.error("DELETE MATERIAL CONSUMPTION ERROR:", error);
    alert(error.message || "Unable to delete entry.");
  }
}

  // =====================================================
  // SAVE MATERIAL CONSUMPTION
  // =====================================================

  async function handleSave() {
    const customer = customers.find(
      (item) => String(item.id) === String(selectedCustomer)
    );

    if (!customer) {
      alert("Please select a customer.");
      return;
    }

    const usedProducts = products
      .map((product, index) => {
        const productKey = `${product.product_name}__${product.category}`;
        const qty = Number(quantities[productKey] || 0);
        const unitType = getProductUnit(product.product_name);

        if (!Number.isFinite(qty) || qty <= 0) return null;

        return {
          product_name: product.product_name,
          category: product.category,
          qty_used: qty,
          unit:
            unitType === "wire"
              ? units[productKey] || "Mtr"
              : unitType,
        };
      })
      .filter(Boolean);

    if (usedProducts.length === 0) {
      alert("Please enter quantity for at least one product.");
      return;
    }

    try {
      setSaving(true);

     const entryData = {
  customer_id: String(customer.id),
  customer_name: customer.customer_name,
  project_id: customer.project?.id
    ? String(customer.project.id)
    : null,
  plant_size: plantSize,
  location,
  products: usedProducts,
};

let error;

if (editingEntryId) {
  ({ error } = await supabase
    .from("plant_material_consumption")
    .update(entryData)
    .eq("id", editingEntryId));
} else {
  ({ error } = await supabase
    .from("plant_material_consumption")
    .insert([entryData]));
}

if (error) throw error;

      alert(
  editingEntryId
    ? "Material consumption updated successfully."
    : "Material consumption saved successfully."
);

      resetForm();
      setEditingEntryId(null);
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("SAVE MATERIAL CONSUMPTION ERROR:", error);
      alert(error.message || "Unable to save material consumption.");
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredEntries = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return entries;

    return entries.filter((entry) =>
      [
        entry.customer_name,
        entry.plant_size,
        entry.location,
        ...(entry.products || []).map((product) => product.product_name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [entries, search]);

  // =====================================================
  // HEADER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        
{/* PAGE HEADER */}
<div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
  <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-2xl" />
  <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />

  <div className="relative z-10 flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/20">
        <Package size={30} />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Plant Material Consumption
        </h1>

        <p className="mt-2 text-sm text-white/90">
          Shiv Shakti Solar Energy
        </p>

        <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
      </div>
    </div>

    <button
      type="button"
      onClick={() => navigate("/customer-service")}
      title="Back to Customer Service"
      aria-label="Back to Customer Service"
      className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm transition hover:bg-white/30"
    >
      <Home size={24} strokeWidth={2.5} />
    </button>
  </div>
</div>


        {!showForm ? (
          <>
            {/* SEARCH AND ADD BUTTON */}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, plant size, location..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={18} />
                Add Material Consumption
              </button>
            </div>

           
{/* VIEW TABLE */}

<div className="overflow-hidden rounded-xl bg-white shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[850px] border-separate border-spacing-0 text-sm">
      <thead className="bg-gray-100 text-black">
        <tr>
          {["S.No.", "Customer Name", "Plant Size", "Location", "Action"].map(
            (heading) => (
              <th
                key={heading}
                style={{
                  border: "1px solid #000",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                className="p-3 font-bold"
              >
                {heading}
              </th>
            )
          )}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan="5"
              style={{
                border: "1px solid #000",
                textAlign: "center",
                verticalAlign: "middle",
              }}
              className="p-6"
            >
              Loading...
            </td>
          </tr>
        ) : filteredEntries.length === 0 ? (
          <tr>
            <td
              colSpan="5"
              style={{
                border: "1px solid #000",
                textAlign: "center",
                verticalAlign: "middle",
              }}
              className="p-6"
            >
              No material consumption entries found.
            </td>
          </tr>
        ) : (
          filteredEntries.map((entry, index) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td
                style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle" }}
                className="p-3"
              >
                {index + 1}
              </td>

              <td
                style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle" }}
                className="p-3 font-semibold"
              >
                {entry.customer_name}
              </td>

              <td
                style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle" }}
                className="p-3"
              >
                {entry.plant_size || "-"}
              </td>

              <td
                style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle" }}
                className="p-3"
              >
                {entry.location || "-"}
              </td>

              <td
                style={{ border: "1px solid #000", textAlign: "center", verticalAlign: "middle" }}
                className="p-3"
              >
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    title="Edit"
                    className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete"
                    className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

          </>
        ) : (
          <>
            {/* ADD FORM HEADER */}

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Add Material Consumption
              </h2>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            </div>

            {/* CUSTOMER DETAILS */}

            <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Customer Name
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Plant Size
                </label>
                <input
                  type="text"
                  value={plantSize}
                  readOnly
                  placeholder="Auto-filled"
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  readOnly
                  placeholder="Auto-filled"
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2.5"
                />
              </div>
            </div>

            {/* PRODUCT CONSUMPTION TABLE */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="border-b p-4">
                <h3 className="font-bold text-gray-800">
                  Material Consumption Details
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] border-separate border-spacing-0 text-sm">
                  <thead className="bg-gray-100 text-black">
  <tr>
    {["S.No.", "Product Name", "Category", "Qty Used", "Unit"].map(
      (heading) => (
        <th
          key={heading}
          style={{
            border: "1px solid #000",
            textAlign: "center",
            verticalAlign: "middle",
          }}
          className="p-3"
        >
          {heading}
        </th>
      )
    )}
  </tr>
</thead>

                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-gray-500">
                          No inventory products found.
                        </td>
                      </tr>
                    ) : (
                      products.map((product, index) => {
                        const productKey =
                          `${product.product_name}__${product.category}`;

                        const unitType = getProductUnit(product.product_name);

                        return (
                          <tr
  key={productKey}
  className="hover:bg-gray-50"
>
                            <td className="border border-black p-3 text-center align-middle">{index + 1}</td>
                            <td
  style={{
    border: "1px solid #000",
    textAlign: "center",
    verticalAlign: "middle",
  }}
  className="p-3 font-semibold"
>
  {product.product_name}
</td>
                            <td className="border border-black p-3 text-center align-middle">{product.category || "-"}</td>
                            <td className="border border-black p-3 text-center align-middle">
  <input
    type="number"
    min="0"
    step="any"
    value={quantities[productKey] || ""}
    onChange={(e) =>
      handleQuantityChange(productKey, e.target.value)
    }
    placeholder="Enter quantity"
    className="mx-auto block w-36 rounded-lg border border-black p-2 text-center"
  />
</td>
                            <td className="border border-black p-3 text-center align-middle">
  {unitType === "wire" ? (
    <select
      value={units[productKey] || "Mtr"}
      onChange={(e) =>
        handleUnitChange(productKey, e.target.value)
      }
      className="mx-auto block rounded-lg border border-black p-2 text-center"
    >
      <option value="Mtr">Mtr</option>
      <option value="Ft">Ft</option>
    </select>
  ) : (
    <span className="font-medium">{unitType}</span>
  )}
</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* SAVE BUTTON */}

              <div className="flex justify-end border-t p-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedCustomer}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving
  ? "Saving..."
  : editingEntryId
    ? "Update"
    : "Save"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
