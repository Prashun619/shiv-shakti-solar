import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    item_name: "",
    category: "",
    quantity: "",
    unit: "Nos",
    purchase_price: "",
    selling_price: "",
    supplier: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setItems(data);
  }

  async function addItem(e) {
    e.preventDefault();

    const { error } = await supabase.from("inventory").insert([
      {
        ...form,
        quantity: Number(form.quantity),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Inventory item added!");

    setForm({
      item_name: "",
      category: "",
      quantity: "",
      unit: "Nos",
      purchase_price: "",
      selling_price: "",
      supplier: "",
    });

    loadItems();
  }

  return (
    <div>
      <h2>Inventory Management</h2>

      <form onSubmit={addItem}>
        <input
          placeholder="Item Name"
          value={form.item_name}
          onChange={(e) => setForm({ ...form, item_name: e.target.value })}
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />

        <input
          placeholder="Supplier"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />

        <button type="submit">Add Item</button>
      </form>

      <hr />

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Supplier</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.item_name}</td>
              <td>{item.category}</td>
              <td
                style={{
                  color: item.quantity < 5 ? "red" : "green",
                  fontWeight: "bold",
                }}
              >
                {item.quantity}
              </td>
              <td>{item.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}