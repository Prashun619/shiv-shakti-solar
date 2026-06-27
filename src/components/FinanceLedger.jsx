import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function FinanceLedger() {
  const [ledger, setLedger] = useState([]);

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    transaction_date: "",
    type: "Debit",
    category: "",
    particulars: "",
    debit: "",
    credit: "",
    payment_mode: "Cash",
    reference_no: "",
    remarks: "",
  });

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    const { data } = await supabase
      .from("finance_ledger")
      .select("*")
      .order("transaction_date", { ascending: false });

    setLedger(data || []);
  }

  async function saveTransaction(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("finance_ledger")
      .insert([
        {
          ...form,
          debit: Number(form.debit || 0),
          credit: Number(form.credit || 0),
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Transaction Saved");

    setForm({
      transaction_date: "",
      type: "Debit",
      category: "",
      particulars: "",
      debit: "",
      credit: "",
      payment_mode: "Cash",
      reference_no: "",
      remarks: "",
    });

    loadLedger();
  }
async function deleteTransaction(id) {

  const confirmDelete = window.confirm(
    "Delete this transaction?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("finance_ledger")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Transaction Removed");
  loadLedger();
}


async function editTransaction(row) {

  setEditId(row.id);

  setForm({
    transaction_date: row.transaction_date,
    type: row.type,
    category: row.category,
    particulars: row.particulars,
    debit: row.debit,
    credit: row.credit,
    payment_mode: row.payment_mode,
    reference_no: row.reference_no,
    remarks: row.remarks,
  });
}
  const totalBalance = ledger.reduce(
  (total, row) => total + Number(row.credit) - Number(row.debit),
  0
);

  return (
    <div>

      <h2>Finance Ledger</h2>
      

      <form onSubmit={saveTransaction}>

  {/* Date */}
  <input
    type="date"
    value={form.transaction_date}
    onChange={(e) =>
      setForm({ ...form, transaction_date: e.target.value })
    }
  />

  {/* Transaction Type */}
  <select
    value={form.type}
    onChange={(e) =>
      setForm({
        ...form,
        type: e.target.value,
        debit: "",
        credit: "",
      })
    }
  >
    <option value="Debit">Debit</option>
    <option value="Credit">Credit</option>
  </select>

  {/* Category */}
  <input
    placeholder="Category"
    value={form.category}
    onChange={(e) =>
      setForm({ ...form, category: e.target.value })
    }
  />

  {/* Particulars */}
  <input
    placeholder="Particulars"
    value={form.particulars}
    onChange={(e) =>
      setForm({ ...form, particulars: e.target.value })
    }
  />

  {/* Debit Amount */}
  {form.type === "Debit" && (
    <input
      type="number"
      placeholder="Debit Amount"
      value={form.debit}
      onChange={(e) =>
        setForm({
          ...form,
          debit: e.target.value,
          credit: "",
        })
      }
    />
  )}

  {/* Credit Amount */}
  {form.type === "Credit" && (
    <input
      type="number"
      placeholder="Credit Amount"
      value={form.credit}
      onChange={(e) =>
        setForm({
          ...form,
          credit: e.target.value,
          debit: "",
        })
      }
    />
  )}

 <button type="submit">
  Add Transaction
</button>

<div
  style={{
    marginTop: "15px",
    textAlign: "right",
    fontWeight: "bold",
    fontSize: "18px",
    color: totalBalance >= 0 ? "green" : "red",
  }}
>
  Balance : ₹ {totalBalance.toLocaleString()}
</div>

      </form>

      <br/>

      <table border="1" width="100%" cellPadding="10">

        <thead>
<tr>
<th>Date</th>
<th>Type</th>
<th>Category</th>
<th>Particulars</th>
<th>Debit</th>
<th>Credit</th>
<th>Action</th>
</tr>
</thead>

        <tbody>

        {ledger.map((row)=>{


            return(
              <tr key={row.id}>
                <td>{row.transaction_date}</td>
                <td>{row.type}</td>
                <td>{row.category}</td>
                <td>{row.particulars}</td>
                <td>₹ {Number(row.debit).toLocaleString()}</td>
                <td>₹ {Number(row.credit).toLocaleString()}</td>
                <td>

<button
  onClick={() => editTransaction(row)}
>
  Edit
</button>


<button
  onClick={() => deleteTransaction(row.id)}
  style={{
    marginLeft:"10px"
  }}
>
  Remove
</button>

</td>
                
              </tr>
            )

        })}

        </tbody>

      </table>

    </div>
  );
}