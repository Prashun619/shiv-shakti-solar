    import { useEffect, useMemo, useState } from "react";
    import { supabase } from "../services/supabase";

    function Customer() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
  name: "",
  location: "",
  plant_size: "",
  quotation: "",
  status: "Pending",
});

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        setLoading(true);

        const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("id", { ascending: false });

        if (!error) {
        setCustomers(data || []);
        }

        setLoading(false);
    }

    async function deleteCustomer(id) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this customer?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  fetchCustomers();
}

function editCustomer(customer) {
  setEditingId(customer.id);

  setForm({
    name: customer.name,
    location: customer.location,
    plant_size: customer.plant_size,
    quotation: customer.quotation,
    status: customer.status,
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

async function addCustomer(e) {
  e.preventDefault();

  if (!form.name.trim()) {
    alert("Enter customer name.");
    return;
  }

  if (!form.location.trim()) {
    alert("Enter location.");
    return;
  }

  if (Number(form.plant_size) <= 0) {
    alert("Plant size must be greater than 0.");
    return;
  }

  if (Number(form.quotation) <= 0) {
    alert("Quotation must be greater than 0.");
    return;
  }

  let error;

  if (editingId) {
    ({ error } = await supabase
      .from("customers")
      .update({
        name: form.name,
        location: form.location,
        plant_size: Number(form.plant_size),
        quotation: Number(form.quotation),
        status: form.status,
      })
      .eq("id", editingId));

    setEditingId(null);
  } else {
    ({ error } = await supabase
      .from("customers")
      .insert([
        {
          name: form.name,
          location: form.location,
          plant_size: Number(form.plant_size),
          quotation: Number(form.quotation),
          status: form.status,
        },
      ]));
  }

  if (error) {
    alert(error.message);
    return;
  }

  setForm({
  name: "",
  location: "",
  plant_size: "",
  quotation: "",
  status: "Pending",
});

setEditingId(null);

  fetchCustomers();
}        
    const filteredCustomers = useMemo(() => {
        return customers.filter(
        (c) =>
            (c.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
            (c.location || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        );
    }, [customers, search]);

    
    return (
    <div
  style={{
    padding: "25px",
    background: "#eef3f8",
    minHeight: "100vh",
  }}
>   
        <h1
  style={{
    textAlign: "center",
    color: "#222",
    fontSize: "42px",        // Reduced from default
    fontWeight: "700",
    marginBottom: "20px",
    letterSpacing: "0.5px",
  }}
>
  ☀️ Customer Management
</h1>

       

        {/* Add Customer Form */}

        <div
  style={{
    background: "#fff",
   padding: "15px 20px",
    borderRadius: "15px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  }}
>
        <h2
            style={{
            color: "#000",
            fontWeight: "bold",
            marginBottom: "20px",
            }}
        >
            Add New Customer
        </h2>

        <form
  onSubmit={addCustomer}
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1.5fr 160px auto",
    gap: "15px",
    alignItems: "center",
  }}
>
  <input
    placeholder="👤 Customer Name"
    value={form.name}
    onChange={(e) => setForm({ ...form, name: e.target.value })}
    style={inputStyle}
  />

  <input
    placeholder="📍 Location"
    value={form.location}
    onChange={(e) => setForm({ ...form, location: e.target.value })}
    style={inputStyle}
  />

  <input
    type="number"
    placeholder="⚡ Plant Size (KW)"
    value={form.plant_size}
    onChange={(e) => setForm({ ...form, plant_size: e.target.value })}
    style={inputStyle}
  />

  <input
  type="number"
  placeholder="₹ Quotation"
  value={form.quotation}
  onChange={(e) =>
    setForm({
      ...form,
      quotation: e.target.value,
    })
  }
  style={inputStyle}
/>

<select
  value={form.status}
  onChange={(e) =>
    setForm({
      ...form,
      status: e.target.value,
    })
  }
  style={inputStyle}
>
  <option value="Pending">Pending</option>
  <option value="Approved">Approved</option>
  <option value="Completed">Completed</option>
  <option value="Cancelled">Cancelled</option>
</select>

<div
  style={{
    display: "flex",
    gap: "5px",
  }}
>
  <button type="submit" style={buttonStyle}>    
    {editingId ? "💾 Update Customer" : "➕ Add Customer"}
  </button>

  {editingId && (
    <button
      type="button"
      onClick={() => {
        setEditingId(null);
        setForm({
          name: "",
          location: "",
          plant_size: "",
          quotation: "",
          status: "Pending",
        });
      }}
      style={{
        background: "#757575",
        color: "#fff",
        border: "none",
        height: "44px",
        padding: "0 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "700",
      }}
    >
      ❌ Cancel
    </button>
  )}
</div>
</form>

        </div>

        {/* Search */}

        <div
  style={{
    display: "flex",
    justifyContent: "center",
    margin: "25px 0",
  }}
>
  <input
    placeholder="🔍 Search by Name or Location..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      ...inputStyle,
      width: "420px",
    }}
  />
</div>    

        {loading ? (
  <h2
    style={{
      color: "#000",
      fontWeight: "bold",
      textAlign: "center",
    }}
  >
    Loading...
  </h2>
) : (
  <div
    style={{
      background: "#fff",
      borderRadius: "15px",
      overflow: "hidden",
      boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
    }}
  >
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th style={tableHeaderStyle}>Name</th>
          <th style={tableHeaderStyle}>Location</th>
          <th style={tableHeaderStyle}>Plant Size</th>
          <th style={tableHeaderStyle}>Quotation</th>
          <th style={tableHeaderStyle}>Status</th>
          <th style={tableHeaderStyle}>Actions</th>
        </tr>
      </thead>

      <tbody>
  {filteredCustomers.map((c, index) => (
    <tr
      key={c.id}
      style={{
        background: index % 2 === 0 ? "#fff" : "#fafafa",
      }}
    >
      <td style={tableCellStyle}>{c.name}</td>

      <td style={tableCellStyle}>{c.location}</td>

      <td style={tableCellStyle}>
        {c.plant_size} KW
      </td>

      <td style={tableCellStyle}>
        ₹ {Number(c.quotation).toLocaleString("en-IN")}
      </td>

      <td style={tableCellStyle}>
        <span style={getStatusStyle(c.status)}>
  {c.status}
</span>
      </td>

      <td style={tableCellStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={() => editCustomer(c)}
            style={editButtonStyle}
          >
            ✏ Edit
          </button>

          <button
            onClick={() => deleteCustomer(c.id)}
            style={deleteButtonStyle}
          >
            🗑 Delete
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
)}
    </div>
  );
}

const tableHeaderStyle = {
  background: "#ff9800",
  color: "#fff",
  padding: "16px",
  fontWeight: "700",
  textAlign: "center",
  fontSize: "16px",
};  

const tableCellStyle = {
  padding: "18px",
  textAlign: "center",
  fontSize: "17px",
  color: "#222",
  fontWeight: "600",
  borderBottom: "1px solid #eee",
};
const getStatusStyle = (status) => ({
  padding: "6px 12px",
  borderRadius: "20px",
  color: "#fff",
  fontWeight: "bold",
  background:
    status === "Completed"
      ? "#4CAF50"
      : status === "Approved"
      ? "#2196F3"
      : status === "Cancelled"
      ? "#F44336"
      : "#FF9800",
});
const inputStyle = {
  padding: "11px 14px",
  height: "44px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  fontSize: "15px",
  background: "#fff",
  color: "#333",
  outline: "none",
};
const buttonStyle = {
  background: "#ff9800",
  color: "#fff",
  border: "none",
  height: "44px",
  padding: "0 20px",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
  fontSize: "15px",
};
const editButtonStyle = {
  background: "#1e88e5",
  color: "#fff",
  border: "none",
  width: "100px",
  height: "40px",
  cursor: "pointer",
  borderRadius: "6px",
  fontWeight: "700",
};

const deleteButtonStyle = {
  background: "#f44336",
  color: "#fff",
  border: "none",
  width: "100px",
  height: "40px",
  cursor: "pointer",
  borderRadius: "6px",
  fontWeight: "700",
};
export default Customer;