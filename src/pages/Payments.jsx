import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Payments() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [projects, setProjects] = useState([]);

  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [amount, setAmount] = useState("");

  /* LOAD CUSTOMERS */
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  }

  /* SEARCH FILTER (NO UI LIST) */
  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  /* ENTER KEY AUTO SELECT */
  function handleSearchKeyDown(e) {
    if (e.key === "Enter" && filteredCustomers.length > 0) {
      selectCustomer(filteredCustomers[0]);
    }
  }

  /* SELECT CUSTOMER */
  async function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setSearch(customer.customer_name);

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

  /* ADD PROJECT */
  async function addProject() {
    if (!selectedCustomer || !name || !size || !amount) return;

    const projectNo = "PRJ-" + Date.now();

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          customer_id: selectedCustomer.id,
          project_no: projectNo,
          project_name: name,
          project_size: size,
          total_amount: Number(amount),
          received: 0,
          remaining: Number(amount),
          project_date: new Date().toISOString(),
          status: "Pending"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setProjects([data, ...projects]);

    setName("");
    setSize("");
    setAmount("");
  }

  /* EDIT PROJECT */
  async function editProject(id) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    const newName = prompt("Project Name", project.project_name);
    const newSize = prompt("Project Size", project.project_size);
    const newAmount = prompt("Project Amount", project.total_amount);

    if (!newName || !newSize || !newAmount) return;

    const received = project.received || 0;
    const remaining = Number(newAmount) - received;

    const { data, error } = await supabase
      .from("projects")
      .update({
        project_name: newName,
        project_size: newSize,
        total_amount: Number(newAmount),
        remaining
      })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      setProjects(projects.map((p) => (p.id === id ? data : p)));
    }
  }

  /* DELETE PROJECT */
  async function deleteProject(id) {
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  }

  return (
    <div className="p-4 space-y-6">

      {/* SEARCH ONLY */}
      <input
        className="border p-2 w-full"
        placeholder="Search customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKeyDown}
      />

      {/* ADD PROJECT FORM */}
      {selectedCustomer && (
        <div className="border p-3 space-y-2">
          <h2 className="font-bold">
            Add Project for {selectedCustomer.customer_name}
          </h2>

          <input
            className="border p-2 w-full"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border p-2 w-full"
            placeholder="Project Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />

          <input
            className="border p-2 w-full"
            placeholder="Project Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button
            onClick={addProject}
            className="bg-green-600 text-white px-4 py-1"
          >
            Add Project
          </button>
        </div>
      )}

      {/* PROJECT LIST */}
      <div className="border p-3">
        <h2 className="font-bold mb-2">Projects</h2>

        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found</p>
        ) : (
          projects.map((p) => {
            const received = Number(p.received || 0);
            const remaining =
              Number(p.remaining ?? (p.total_amount - received));

            return (
              <div
                key={p.id}
                className="flex justify-between items-center border-b py-2"
              >
                {/* ONE LINE PROJECT INFO */}
                <div className="text-sm">
                  <b>{p.project_no}</b> | {p.project_name} | ₹{p.total_amount} |
                  Size: {p.project_size} |
                  Received: ₹{received} |
                  Remaining: ₹{remaining}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => editProject(p.id)}
                    className="bg-blue-600 text-white px-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteProject(p.id)}
                    className="bg-red-600 text-white px-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}