import { useEffect, useMemo, useState } from "react";

import {
  addInventory,
  updateInventory,
} from "../services/inventoryService";

export default function InventoryModal({
  open,
  onClose,
  onSaved,
  product,
}) {

  const inventoryProducts = [

  "Panel",
  "Inverter",
  "Rafter",
  "Perlin",
  "Leg 6ft",
  "Leg 8ft",
  "Leg 10ft",
  "Base Plate",
  "Fastener",
  "Nut Bolts",
  "Spring Bolt",
  "Spring",
  "ACDB",
  "DCDB",
  "DC Wire",
  "AC Wire",
  "LA Wire",
  "Armoured Wire",
  "L Clamp",
  "U Clamp",
  "MC4 Connector",
  "PVC Pipe",
  "L Bend",
  "U Bend",
  "T Bend",
  "Catchup 25mm",
  "Catchup 12mm",
  "Earthing Kit"

];

const productCategoryMap = {

  "Panel": "Panel",

  "Inverter": "Inverter",

  "Rafter": "Structure",
  "Perlin": "Structure",
  "Leg 6ft": "Structure",
  "Leg 8ft": "Structure",
  "Leg 10ft": "Structure",
  "Base Plate": "Structure",

  "Fastener": "Hardware",
  "Nut Bolts": "Hardware",
  "Spring Bolt": "Hardware",
  "Spring": "Hardware",

  "ACDB": "Electrical",
  "DCDB": "Electrical",

  "DC Wire": "Wire",
  "AC Wire": "Wire",
  "LA Wire": "Wire",
  "Armoured Wire": "Wire",

  "L Clamp": "Hardware",
  "U Clamp": "Hardware",

  "MC4 Connector": "Electrical",

  "PVC Pipe": "Accessories",
  "L Bend": "Accessories",
  "U Bend": "Accessories",
  "T Bend": "Accessories",

  "Catchup 25mm": "Accessories",
  "Catchup 12mm": "Accessories",

  "Earthing Kit": "Electrical"

};

  const initialForm = {
  date: new Date().toISOString().split("T")[0],

  supplier: "",

  product_name: "",

  category: "",

  company: "",

  specification: "",

  quantity: "",

  unit: "Nos",

  unit_cost: "",

  cgst: "",

  sgst: "",

  transportation: "",

};

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(false);

  const categories = [
  "Panel",
  "Inverter",
  "Structure",
  "Electrical",
  "Hardware",
  "Accessories",
  "Safety",
  "Civil",
  "Services",
];

const units = [
  "Nos",
  "Meter",
  "Feet",
  "Kg",
  "Pair",
  "Set",
  "Pack",
  "Roll",
  "Box",
];

  useEffect(() => {

  if (product) {

    console.log("EDIT PRODUCT DATA:", product);

    setForm({

      date: product.date || new Date().toISOString().split("T")[0],

      supplier: product.supplier || "",

      product_name: product.product_name || "",

      category: product.category || "",

      company: product.company || "",

      specification: product.specification || "",

      quantity: product.quantity || "",

      unit: product.unit || "Nos",

      unit_cost: product.price || product.unit_cost || "",

      cgst: product.cgst || "",

      sgst: product.sgst || "",

      transportation: product.transportation || "",

      remarks: product.remarks || "",

      active: product.active ?? true,

      is_default: product.is_default ?? false,

    });

  } else {

    setForm({

      date: new Date().toISOString().split("T")[0],

      supplier: "",

      product_name: "",

      category: "",

      company: "",

      specification: "",

      quantity: "",

      unit: "Nos",

      unit_cost: "",

      cgst: "",

      sgst: "",

      transportation: "",

      remarks: "",

      active: true,

      is_default: false,

    });

  }

}, [product, open]);
    
  function handleChange(e) {

  const { name, value, type, checked } = e.target;

  setForm((prev) => ({

    ...prev,

    [name]: type === "checkbox" ? checked : value,

  }));

}
  const baseAmount = useMemo(() => {
    return (
      Number(form.quantity || 0) *
      Number(form.unit_cost || 0)
    );
  }, [form.quantity, form.unit_cost]);

  const cgstAmount = useMemo(() => {
    return (
      baseAmount *
      Number(form.cgst || 0) /
      100
    );
  }, [baseAmount, form.cgst]);

  const sgstAmount = useMemo(() => {
    return (
      baseAmount *
      Number(form.sgst || 0) /
      100
    );
  }, [baseAmount, form.sgst]);

  const totalAmount = useMemo(() => {
    return (
      baseAmount +
      cgstAmount +
      sgstAmount +
      Number(form.transportation || 0)
    );
  }, [
    baseAmount,
    cgstAmount,
    sgstAmount,
    form.transportation,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (
  ["Panel", "Inverter"].includes(form.category)
) {

  if (!form.company.trim()) {
    alert("Please enter Company.");
    return;
  }

  if (!form.specification.trim()) {
    alert("Please enter Specification.");
    return;
  }

}

    try {
      setLoading(true);

     const payload = {

  ...form,

  quantity: Number(form.quantity || 0),

  price: Number(form.unit_cost || 0),

  unit_cost: Number(form.unit_cost || 0),

  cgst: Number(form.cgst || 0),

  sgst: Number(form.sgst || 0),

  transportation: Number(form.transportation || 0),

  total_amount: totalAmount,

};
console.log("SAVE PAYLOAD:", payload);
      if (product) {
  await updateInventory(product.id, payload);
} else {

  payload.batch_id = `PUR${Date.now()}`;

  await addInventory(payload);
}

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-4 max-h-[90vh] overflow-y-auto text-sm">

        <h2 className="text-lg font-bold mb-3">
          {product ? "Edit Purchase" : "Add Purchase"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-2">

          <div className="grid grid-cols-2 gap-2">

            <div>
              <label className="block mb-1 font-medium">
                Date
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="border rounded-lg px-2 py-1 w-full text-sm"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Supplier
              </label>

              <input
                type="text"
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Product
              </label>

              <select
name="product_name"
value={form.product_name}
onChange={(e)=>{

const product =
e.target.value;


setForm(prev=>({

...prev,

product_name: product,

category:
productCategoryMap[product] || ""

}));

}}
className="border rounded-lg p-2 w-full"
required
>

<option value="">
Select Product
</option>

{inventoryProducts.map((product)=>(

<option
key={product}
value={product}
>
{product}
</option>

))}

</select>
            </div>

            <div>
  <label className="block mb-1 font-medium">
    Category
  </label>

  <select
    name="category"
    value={form.category}
    onChange={handleChange}
    className="border rounded-lg p-2 w-full"
    required
  >
    <option value="">Select Category</option>

    {categories.map((cat) => (
      <option key={cat} value={cat}>
        {cat}
      </option>
    ))}
  </select>
</div>

{["Panel", "Inverter"].includes(form.product_name) && (
  <>
    <div>
      <label className="block mb-1 font-medium">
        Company
      </label>

      <input
        type="text"
        name="company"
        value={form.company}
        onChange={handleChange}
        className="border rounded-lg px-2 py-1 w-full"
        required
      />
    </div>

    <div>
      <label className="block mb-1 font-medium">
        Specification
      </label>

      <input
        type="text"
        name="specification"
        placeholder={
          form.category === "Panel"
            ? "605Wp"
            : "3KW"
        }
        value={form.specification}
        onChange={handleChange}
        className="border rounded-lg p-2 w-full"
        required
      />
    </div>
  </>
)}

            <div>
              <label className="block mb-1 font-medium">
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full"
                required
              />
            </div>

            <div>
  <label className="block mb-1 font-medium">
    Unit
  </label>

  <select
    name="unit"
    value={form.unit}
    onChange={handleChange}
    className="border rounded-lg p-2 w-full"
  >
    {units.map((unit) => (
      <option key={unit} value={unit}>
        {unit}
      </option>
    ))}
  </select>
</div>

            <div>
  <label className="block mb-1 font-medium">
    Unit Cost
  </label>

 <input
  type="number"
  name="unit_cost"
  value={form.unit_cost}
  onChange={handleChange}
  className="border rounded-lg p-2 w-full"
  required
/>
</div>

            <div>
              <label className="block mb-1 font-medium">
                Transportation
              </label>

              <input
                type="number"
                name="transportation"
                value={form.transportation}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                CGST %
              </label>

              <input
                type="number"
                name="cgst"
                value={form.cgst}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                SGST %
              </label>

              <input
                type="number"
                name="sgst"
                value={form.sgst}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">

        </div>

          <div className="bg-gray-50 rounded-lg p-4 border">

            <div className="flex justify-between mb-2">
              <span>Base Amount</span>
              <strong>₹ {baseAmount.toLocaleString()}</strong>
            </div>

            <div className="flex justify-between mb-2">
              <span>CGST Amount</span>
              <strong>₹ {cgstAmount.toLocaleString()}</strong>
            </div>

            <div className="flex justify-between mb-2">
              <span>SGST Amount</span>
              <strong>₹ {sgstAmount.toLocaleString()}</strong>
            </div>

            <div className="flex justify-between mb-2">
              <span>Transportation</span>
              <strong>₹ {Number(form.transportation || 0).toLocaleString()}</strong>
            </div>

            <hr className="my-2" />

            <div className="flex justify-between text-xl font-bold text-green-700">
              <span>Total Amount</span>
              <span>₹ {totalAmount.toLocaleString()}</span>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              {loading
                ? "Saving..."
                : product
                ? "Update Purchase"
                : "Save Purchase"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}