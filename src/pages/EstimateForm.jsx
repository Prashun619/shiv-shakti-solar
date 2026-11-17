import html2pdf from "html2pdf.js";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";
export default function EstimateForm() {

  
const productOptions = [
  {
    product: "Solar Panel",
    descriptions: [
      "Adani 580 wp",
      "Adani 585 wp",
      "Adani 600 wp",
      "Adani 620 wp",
      "Waaree 580 wp",
      "Waaree 585 wp",
      "Waaree 620 wp",
    ],
  },
  {
    product: "Solar Inverter",
    descriptions: [
      "Polycab 3 KW",
      "Polycab 3.6 KW",
      "Polycab 5 KW",
      "Polycab 8 KW",
      "Polycab 10 KW",
      "Luminous 3 KW",
      "Luminous 5 KW",
      "Waaree 3 KW",
      "Waaree 5 KW",
    ],
  },
  { product: "Solar Structure", description: "JSW or APLApollo" },
  { product: "ACDB & DCDB Box", description: "Polycab" },
  { product: "AC Wire", description: "Polycab 4 mmsq" },
  { product: "DC Wire", description: "Polycab 4 mmsq" },
  { product: "Earthing Wire", description: "16mmsq" },
  { product: "Armoured Wire", description: "12 mmsq" },
  { product: "Earthing Kit", description: "Copper" },
  { product: "Installation Charges", description: "" },
  { product: "MPEB Charges", description: "" },
  { product: "Miscellaneous Charges", description: "" },
];


const [plantSize, setPlantSize] = useState("");
const [customerName, setCustomerName] = useState("");
const [customerLocation, setCustomerLocation] = useState("");
const [estimateDate, setEstimateDate] = useState(
  new Date().toISOString().slice(0, 10)
);

const panelQtyBySize = {
  "3 KW": 5,
  "3.5 KW": 6,
  "5 KW": 9,
  "7 KW": 12,
  "8 KW": 14,
  "10 KW": 18,
};

const allInverters = [
  "Polycab 3 KW",
  "Polycab 3.6 KW",
  "Polycab 5 KW",
  "Polycab 8 KW",
  "Polycab 10 KW",
  "Luminous 3 KW",
  "Luminous 5 KW",
  "Waaree 3 KW",
  "Waaree 5 KW",
];

const getCompatibleInverters = (size) => {
  const allowedSizes = {
    "3 KW": ["3 KW"],
    "3.5 KW": ["3.6 KW"],
    "5 KW": ["5 KW"],
    "7 KW": ["8 KW"],
    "8 KW": ["8 KW"],
    "10 KW": ["10 KW"],
  };

  return allInverters.filter((name) =>
    (allowedSizes[size] || []).some((kw) => name.endsWith(kw))
  );
};

const initialProducts = [
  {
    product: "Solar Panel",
    descriptions: [
      "Adani 580 wp",
      "Adani 585 wp",
      "Adani 600 wp",
      "Adani 620 wp",
      "Waaree 580 wp",
      "Waaree 585 wp",
      "Waaree 620 wp",
    ],
    qty: 0,
    price: 0,
    description: "",
  },
  {
    product: "Solar Inverter",
    descriptions: allInverters,
    qty: 0,
    price: 0,
    description: "",
  },
  {
    product: "Solar Structure",
    description: "JSW / APL Apollo",
    qty: 0,
    price: 0,
  },
  {
    product: "ACDB & DCDB Box",
    descriptions: ["Havells 4mmsq", "Polycab 4mmsq"],
    qty: 0,
    price: 0,
    description: "",
  },
  {
    product: "AC Wire",
    descriptions: ["Polycab 4mmsq", "Waacab 4mmsq"],
    qty: 0,
    price: 0,
    description: "",
  },
  {
    product: "DC Wire",
    descriptions: ["Polycab 4mmsq", "Waacab 4mmsq"],
    qty: 0,
    price: 0,
    description: "",
  },
  {
    product: "Earthing Wire",
    description: "16mmsq",
    qty: 0,
    price: 0,
  },
  {
    product: "Armoured Wire",
    description: "12 mmsq",
    qty: 0,
    price: 0,
  },
  {
    product: "Earthing Kit",
    description: "Copper",
    qty: 0,
    price: 0,
  },
  {
    product: "Installation Charges",
    description: "",
    qty: 0,
    price: 0,
  },
  {
    product: "MPEB Charges",
    description: "",
    qty: 0,
    price: 0,
  },
  {
    product: "Miscellaneous Charges",
    description: "",
    qty: 0,
    price: 0,
  },
];

const [items, setItems] = useState(initialProducts);


const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "edit";

const isViewMode = mode === "view" || mode === "pdf";
const isPdfMode = mode === "pdf";

const [isLoading, setIsLoading] = useState(true);
const pdfDownloadStarted = useRef(false);

useEffect(() => {
  const loadEstimate = async () => {
    const params = new URLSearchParams(window.location.search);
    const estimateId = params.get("id");

    if (!estimateId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", estimateId)
        .single();

      if (error) throw error;

      setCustomerName(data.customer_name ?? "");
      setCustomerLocation(data.location ?? "");
      setEstimateDate(data.estimate_date ?? new Date().toISOString().slice(0, 10));
      setPlantSize(data.plant_size ?? "");

      if (Array.isArray(data.items)) {
        setItems(
          initialProducts.map((product) => {
            const savedItem = data.items.find(
              (item) => item.product === product.product
            );

            return savedItem
              ? { ...product, ...savedItem }
              : product;
          })
        );
      }
    } catch (error) {
      console.error("Error loading quotation:", error);
      alert(`Unable to load quotation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  loadEstimate();
}, []);



const updateItem = (index, changes) => {
  setItems((current) =>
    current.map((item, i) =>
      i === index ? { ...item, ...changes } : item
    )
  );
};

const handlePlantSizeChange = (size) => {
  setPlantSize(size);

  setItems((current) =>
    current.map((item) => {
      if (item.product === "Solar Panel") {
        return {
          ...item,
          qty: panelQtyBySize[size] ?? 0,
        };
      }

      if (item.product === "Solar Inverter") {
        const compatible = getCompatibleInverters(size);

        return {
          ...item,
          description: compatible.includes(item.description)
            ? item.description
            : "",
        };
      }

      return item;
    })
  );
};

const grandTotal = items.reduce((total, item) => {
  const price = Number(item.price) || 0;

  const isFixedAmount = [
    "Installation Charges",
    "MPEB Charges",
    "Miscellaneous Charges",
  ].includes(item.product);

  return total + (isFixedAmount ? price : (Number(item.qty) || 0) * price);
}, 0);


const numberToWords = (number) => {
  if (number === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const convert = (n) => {
    if (n < 20) return ones[n];

    if (n < 100) {
      return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
    }

    if (n < 1000) {
      return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + convert(n % 100) : ""}`;
    }

    return "";
  };

  const rupees = Math.floor(number);
  const paise = Math.round((number - rupees) * 100);

  const groups = [
    { value: Math.floor(rupees / 10000000), name: "Crore" },
    { value: Math.floor((rupees % 10000000) / 100000), name: "Lakh" },
    { value: Math.floor((rupees % 100000) / 1000), name: "Thousand" },
    { value: Math.floor((rupees % 1000) / 100), name: "Hundred" },
  ];

  let words = "";

  groups.forEach(({ value, name }) => {
    if (value > 0) {
      words += `${convert(value)} ${name} `;
    }
  });

  const lastTwoDigits = rupees % 100;

  if (lastTwoDigits > 0) {
    words += `${convert(lastTwoDigits)} `;
  }

  words = words.trim() || "Zero";

  if (paise > 0) {
    words += ` Rupees and ${convert(paise)} Paise Only`;
  } else {
    words += " Rupees Only";
  }

  return words;
};


const handleSaveEstimate = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const estimateId = params.get("id");

    const payload = {
      customer_name: customerName,
      location: customerLocation,
      estimate_date: estimateDate,
      plant_size: plantSize,
      items,
      total: grandTotal,
    };

    let result;

    if (estimateId) {
      result = await supabase
        .from("estimates")
        .update(payload)
        .eq("id", estimateId)
        .select("id")
        .single();
    } else {
      result = await supabase
        .from("estimates")
        .insert(payload)
        .select("id")
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    // Keep the saved ID in the URL so future saves update this quotation.
    const savedId = result.data.id;
    params.set("id", savedId);

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    alert("Quotation saved successfully!");
window.location.href = "/estimate";
  } catch (error) {
    console.error("Error saving quotation:", error);
    alert(`Unable to save quotation: ${error.message}`);
  }
};


const handleDownloadPDF = async () => {
  const element = document.querySelector(".quotation-page");

  if (!element) {
    alert("Quotation is not ready for download.");
    return;
  }

  let wrapper = null;

  try {
    const clone = element.cloneNode(true);

    // Replace form controls with text while preserving inline alignment.
    const originalControls = element.querySelectorAll(
      "input, select, textarea"
    );
    const clonedControls = clone.querySelectorAll(
      "input, select, textarea"
    );

    originalControls.forEach((control, index) => {
      const copy = clonedControls[index];
      if (!copy) return;

      let value = "";

      if (control.tagName === "SELECT") {
        value = control.value
          ? control.selectedOptions[0]?.textContent || ""
          : "";
      } else if (
        control.type === "checkbox" ||
        control.type === "radio"
      ) {
        value = control.checked ? "✓" : "";
      } else {
        value = control.value || "";
      }

      const text = document.createElement("span");
      const computed = window.getComputedStyle(control);

      text.textContent = value;
      text.style.display = "inline-block";
      text.style.width = "100%";
      text.style.margin = "0";
      text.style.padding = "0";
      text.style.border = "0";
      text.style.boxSizing = "border-box";
      text.style.font = computed.font;
      text.style.color = "#000";
      text.style.textAlign = "center";
      text.style.lineHeight = "normal";
      text.style.verticalAlign = "middle";
      text.style.whiteSpace = "normal";
      text.style.overflowWrap = "anywhere";

      copy.replaceWith(text);
    });

    // Preserve the original table structure and column widths.
    clone.querySelectorAll("table").forEach((table) => {
      table.style.width = "100%";
      table.style.tableLayout = "fixed";
      table.style.borderCollapse = "collapse";
    });

    // Align content directly inside each table cell.
    clone.querySelectorAll("table th, table td").forEach((cell) => {
      cell.style.setProperty("vertical-align", "middle", "important");
      cell.style.setProperty("text-align", "center", "important");
      cell.style.setProperty("box-sizing", "border-box", "important");
      cell.style.setProperty("line-height", "1.2", "important");

      // Keep cell padding consistent without changing row heights.
      cell.style.setProperty("padding-top", "4px", "important");
      cell.style.setProperty("padding-bottom", "4px", "important");
    });

    clone.style.width = "186mm";
    clone.style.height = "auto";
    clone.style.minHeight = "0";
    clone.style.overflow = "visible";
    clone.style.padding = "6mm";
    clone.style.boxSizing = "border-box";
    clone.style.backgroundColor = "#fff";

    // Place the clone off-screen for PDF rendering.
    wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.width = "186mm";
    wrapper.style.backgroundColor = "#fff";
    wrapper.style.pointerEvents = "none";

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await html2pdf()
      .set({
        margin: 8,
        filename: `Quotation-${(customerName || "Customer")
          .replace(/[^a-z0-9-_ ]/gi, "")
          .trim()}.pdf`,
        image: {
          type: "jpeg",
          quality: 1,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
        },
      })
      .from(clone)
      .save();
  } catch (error) {
    console.error("PDF download failed:", error);
    alert("Unable to download PDF. Please try again.");
  } finally {
    if (wrapper?.parentElement) {
      wrapper.remove();
    }
  }
};



useEffect(() => {
  if (!isPdfMode || isLoading || pdfDownloadStarted.current) {
    return;
  }

  pdfDownloadStarted.current = true;

  handleDownloadPDF();
}, [isPdfMode, isLoading]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto mb-4 flex justify-end print:hidden">
      <button
  type="button"
  onClick={() => window.location.href = "/estimate"}
  className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
>
  Back
</button>

 {!isViewMode && (
  <button
    type="button"
    onClick={handleSaveEstimate}
    className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
  >
    Save
  </button>
)}
      </div>

     {isLoading ? (
  <p className="text-center">Loading quotation...</p>
) : (

      <main className="quotation-page mx-auto bg-white p-0 text-black">
        {/* Company Header */}
        <header className="quotation-header">
          <div className="flex items-center gap-4">
            <div className="flex w-1/6 shrink-0 items-center justify-center">
              <img
                src="/logo.png"
                alt="Shiv Shakti Solar Energy Logo"
                className="max-h-28 max-w-full object-contain"
              />
            </div>

            <div className="flex-1/2 text-center">
              <h1 className="text-3xl font-bold">
                Shiv Shakti Solar Energy
              </h1>

              <p className="mt-1 text-sm">
                Ward No. 7, Infront Of Stadium, Nowgong,
                              Distt - Chhatarpur (MP)
              </p>

              <p className="mt-1 text-sm font-semibold">
                Contact No. - 9406731278, 9015851961
              </p>
            </div>
          </div>
<div className="quotation-header-line mt-1 w-100%" />
         
{/* Quotation Heading and Date */}
<div className="relative mt-1 flex items-center justify-center">
  <h2 className="quotation-title text-xl font-bold">
    Quotation
  </h2>

  <div className="absolute right-0 flex items-center gap-2">
    <label
      htmlFor="estimateDate"
      className="whitespace-nowrap text-sm font-bold"
    >
      Date:
    </label>

    <input
  id="estimateDate"
  disabled={isViewMode}
  name="estimateDate"
  type="date"
  value={estimateDate}
  onChange={(e) => setEstimateDate(e.target.value)}
  className="border-b border-black bg-transparent px-1 py-1 text-sm outline-none"
/>
  </div>
</div>

{/* Customer Details */}
<div className="mt-4 grid grid-cols-12 items-center gap-3 text-sm">
  {/* Customer Name */}
  <div className="col-span-5 flex min-w-0 items-center gap-2">
    <label
      htmlFor="customerName"
      className="shrink-0 whitespace-nowrap font-bold"
    >
      Customer Name:
    </label>

    <input
  id="customerName"
  disabled={isViewMode}
  name="customerName"
  type="text"
  value={customerName}
  onChange={(e) => setCustomerName(e.target.value)}
  className="w-full min-w-0 border-b border-black bg-transparent px-1 py-1 outline-none"
  placeholder="Enter name"
/>
  </div>

  {/* Location */}
  <div className="col-span-4 flex min-w-0 items-center gap-2">
    <label
      htmlFor="customerLocation"
      className="shrink-0 font-bold"
    >
      Location:
    </label>

    <input
  id="customerLocation"
  disabled={isViewMode}
  name="customerLocation"
  type="text"
  value={customerLocation}
  onChange={(e) => setCustomerLocation(e.target.value)}
  className="w-full min-w-0 border-b border-black bg-transparent px-1 py-1 outline-none"
  placeholder="Enter location"
/>
  </div>

  {/* Plant Size */}
  <div className="col-span-3 flex min-w-0 items-center gap-2">
    <label
      htmlFor="plantSize"
      className="shrink-0 whitespace-nowrap font-bold"
    >
      Plant Size:
    </label>

   
<select
  id="plantSize"
  disabled={isViewMode}
  name="plantSize"
  value={plantSize}
  onChange={(e) => handlePlantSizeChange(e.target.value)}
  className="w-full min-w-0 border border-black bg-white px-1 py-1 text-sm"
>
  <option value="">Select</option>
  <option value="3 KW">3 KW</option>
  <option value="3.5 KW">3.5 KW</option>
  <option value="5 KW">5 KW</option>
  <option value="7 KW">7 KW</option>
  <option value="8 KW">8 KW</option>
  <option value="10 KW">10 KW</option>
</select>

  </div>
</div>



{/* Quotation Items Table */}
<table className="mt-5 w-full table-fixed border-collapse text-center text-xs">
  <colgroup>
    <col style={{ width: "8%" }} />
    <col style={{ width: "21%" }} />
    <col style={{ width: "29%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "17%" }} />
  </colgroup>

  <thead>
    <tr className="bg-gray-100">
      <th className="border border-black px-1 py-2">Sr. No.</th>
      <th className="border border-black px-1 py-2">Product</th>
      <th className="border border-black px-1 py-2">Description</th>
      <th className="border border-black px-1 py-2">Qty</th>
      <th className="border border-black px-1 py-2">Price (₹)</th>
      <th className="border border-black px-1 py-2">Amount (₹)</th>
    </tr>
  </thead>

  <tbody>
    {items.map((item, index) => {
      const compatibleInverters = getCompatibleInverters(plantSize);

      const descriptions =
        item.product === "Solar Inverter"
          ? compatibleInverters
          : item.descriptions;

      const amount =
        (Number(item.qty) || 0) * (Number(item.price) || 0);

      return (
        <tr key={item.product} className="h-8">
          <td className="border border-black px-1 py-1">
            {index + 1}
          </td>

          <td className="border border-black px-1 py-1 text-center font-semibold">
            {item.product}
          </td>

          <td className="border border-black px-1 py-1 text-center font-semibold">
            {descriptions ? (
              <select
                value={item.description || ""}
                disabled={isViewMode}
                onChange={(e) => {
                  const changes = { description: e.target.value };

                  if (item.product === "Solar Panel" && plantSize) {
                    changes.qty = panelQtyBySize[plantSize] ?? 0;
                  }

                  updateItem(index, changes);
                }}
                className="w-full min-w-0 bg-transparent text-center outline-none"
              >
                <option value="">Select</option>
                {descriptions.map((description) => (
                  <option key={description} value={description}>
                    {description}
                  </option>
                ))}
              </select>
            ) : (
              item.description || "\u00A0"
            )}
          </td>

          <td className="border border-black p-1 text-center">
  {[
  "Installation Charges",
  "MPEB Charges",
  "Miscellaneous Charges",
].includes(item.product) ? null : (
    <input
      type="number"
      min="0"
      step="1"
      value={item.qty ?? ""}
      onChange={(e) =>
        updateItem(index, { qty: e.target.value })
      }
      onWheel={(e) => e.currentTarget.blur()}
      className="w-full min-w-0 text-center outline-none"
      placeholder="0"
    />
  )}
</td>

      
<td className="border border-black p-1 text-center">
  <input
    type="number"
    min="0"
    step="0.01"
    value={item.price ?? ""}
    onChange={(e) =>
      updateItem(index, { price: e.target.value })
    }
    onWheel={(e) => e.currentTarget.blur()}
    className="w-full min-w-0 text-center outline-none"
    placeholder="0.00"
  />
</td>


          
<td className="border border-black px-1 py-1 text-center font-semibold">
  {(
    [
      "Installation Charges",
      "MPEB Charges",
      "Miscellaneous Charges",
    ].includes(item.product)
      ? Number(item.price) || 0
      : (Number(item.qty) || 0) * (Number(item.price) || 0)
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

        </tr>
      );
    })}

    {/* Grand Total */}
    <tr className="font-bold">
      <td
        colSpan={5}
        className="border border-black px-2 py-2 text-center font-semibold"
      >
        Grand Total
      </td>
      <td className="border border-black px-1 py-2 font-bold text-center">
        ₹ {grandTotal.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
    </tr>
  </tbody>
</table>



{/* Amount in Words */}
<div className="mt-3 w-full border border-black px-3 py-2 text-sm">
  <div className="font-bold">
    Amount in Words:
  </div>

  <div className="mt-1 font-semibold">
    {numberToWords(Math.round(grandTotal * 100) / 100)}
  </div>
</div>

{/* Bottom Three Connected Blocks */}
<div className="mt-4 grid grid-cols-3 w-full border border-black text-xs">

  
{/* 1. Bank Details */}
<div className="border-r border-black p-3 text-[13px] font-semibold">
  <div className="font-bold text-sm mb-3">
    Bank Details
  </div>

  <div className="space-y-3">
    <div>
      <span className="font-bold">Name: </span>
      <span>Shiv Shakti Solar Energy</span>
    </div>

    <div>
      <span className="font-bold">Bank Name: </span>
      <span>Canara Bank</span>
    </div>

    <div>
      <span className="font-bold">Account No.: </span>
      <span>120040318797</span>
    </div>

    <div>
      <span className="font-bold">Branch: </span>
      <span>Nowgong</span>
    </div>

    <div>
      <span className="font-bold">IFSC Code: </span>
      <span>CNRB0017736</span>
    </div>
  </div>
</div>


  {/* 2. Terms and Conditions */}
  <div className="border-r border-black p-3 text-[12px]">
    <div className="font-bold text-sm mb-2">
      Terms and Condition
    </div>

    <div className="mt-4">
      Thanks for doing business with us !
    </div>
  </div>

  
{/* 3. Authorized Signatory */}
<div className="p-3 flex flex-col">
  <div className="font-bold text-xs">
    For: Shiv Shakti Solar Energy
  </div>

  <div className="flex-1 min-h-[60px] flex items-center justify-center">
    <img
      src="/signature1.png"
      alt="Authorized Signature"
      className="max-w-[130px] max-h-[65px] object-contain"
    />
  </div>

  <div className="text-center font-semibold border-t border-black pt-2">
    Authorized Signatory
  </div>
</div>


</div>
          
        </header>
      </main>
)}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        .quotation-page {
  width: 186mm;
  min-height: 0;
  height: auto;
  box-sizing: border-box;
  border: 3px solid black;
  padding: 6mm;
  overflow: visible;
}

        .quotation-header {
          width: 100%;
          box-sizing: border-box;
        }

        .quotation-title {
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .quotation-header-line {
          width: 100%;
          height: 3px;
          background: #000;
        }

        @media screen {
          .quotation-page {
            padding: 8mm;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
          }
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .quotation-page {
  width: 100%;
  min-height: 0;
  height: auto;
  margin: 0;
  padding: 0;
  box-shadow: none;
  overflow: visible;
}

.quotation-page,
.quotation-page * {
  overflow-wrap: anywhere;
}

.quotation-page table {
  width: 100%;
  table-layout: fixed;
}

.quotation-page td,
.quotation-page th {
  white-space: normal;
  overflow: visible;
}

          .quotation-header {
            break-inside: avoid;
          }

          .print\\\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
  
}
