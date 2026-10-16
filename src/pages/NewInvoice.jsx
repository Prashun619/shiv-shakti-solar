import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { generateNewInvoicePDF } from "../services/newInvoicePdf";
import {
  getMasterInventory,
} from "../services/inventoryService";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Pencil,
  Download,
  X,
} from "lucide-react";

import {
  getNextNewInvoiceNumber,
  getNewInvoiceCustomers,
  getNewInvoices,
  saveNewInvoice,
  getNewInvoiceById,
  updateNewInvoice,
  deleteNewInvoice,
} from "../services/newInvoiceService";

export default function NewInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

 const editId = searchParams.get("id");

const viewMode =
  searchParams.get("view") === "1";

  const [loading, setLoading] =
    useState(false);

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [loadingInvoices, setLoadingInvoices] =
    useState(true);

  const [customers, setCustomers] =
    useState([]);

  const [newInvoices, setNewInvoices] =
    useState([]);

    const [inventoryProducts, setInventoryProducts] =
  useState([]);

const [loadingProducts, setLoadingProducts] =
  useState(true);

  const [showForm, setShowForm] =
    useState(Boolean(editId));

  const [invoice, setInvoice] = useState({
    invoice_number: "",
    invoice_date:
      new Date().toISOString().split("T")[0],

    customer_name: "",
    customer_address: "",

    received: 0,

    items: [],
  });

  const [item, setItem] = useState({
    name: "",
    hsn: "",
    qty: 1,
    price: "",
    gst: "5",
  });

  /* ============================================================
     LOAD CUSTOMERS
  ============================================================ */

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoadingCustomers(true);

        const [
          customerData,
          invoiceData,
        ] = await Promise.all([
          getNewInvoiceCustomers(),
          getNewInvoices(),
        ]);

        const currentInvoiceId =
          editId
            ? String(editId)
            : null;

        const invoicedCustomerNames =
          new Set(
            (invoiceData || [])
              .filter(
                (currentInvoice) =>
                  !currentInvoiceId ||
                  String(currentInvoice.id) !==
                    currentInvoiceId
              )
              .map((currentInvoice) =>
                String(
                  currentInvoice.customer_name || ""
                )
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          );

        const availableCustomers =
          (customerData || []).filter(
            (customer) => {
              const customerName =
                String(
                  customer.name ||
                    customer.customer_name ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              return (
                customerName &&
                !invoicedCustomerNames.has(
                  customerName
                )
              );
            }
          );

        setCustomers(
          availableCustomers
        );
      } catch (error) {
        console.error(
          "CUSTOMER LOAD ERROR:",
          error
        );

        alert(
          error?.message ||
            "Unable to load customers."
        );
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, [editId]);

  /* ============================================================
   LOAD ALL INVENTORY PRODUCTS
   Shows products even when stock is 0
============================================================ */

useEffect(() => {
  async function loadInventoryProducts() {
    try {
      setLoadingProducts(true);

      const data =
        await getMasterInventory();

      const products = Array.isArray(data)
  ? [...data].sort((a, b) => {
      const nameA = String(
        a.product_name || a.name || ""
      ).trim();

      const nameB = String(
        b.product_name || b.name || ""
      ).trim();

      return nameA.localeCompare(
        nameB,
        undefined,
        { sensitivity: "base" }
      );
    })
  : [];

setInventoryProducts(products);
    } catch (error) {
      console.error(
        "INVOICE PRODUCT LOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  loadInventoryProducts();
}, []);

  /* ============================================================
     LOAD NEW INVOICES
  ============================================================ */

  async function loadNewInvoices() {
    try {
      setLoadingInvoices(true);

      const data =
        await getNewInvoices();

      setNewInvoices(data || []);
    } catch (error) {
      console.error(
        "NEW INVOICE LOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to load invoices."
      );
    } finally {
      setLoadingInvoices(false);
    }
  }

  useEffect(() => {
    loadNewInvoices();
  }, []);

  /* ============================================================
     LOAD EXISTING INVOICE
  ============================================================ */

  useEffect(() => {
    if (!editId) return;

    setShowForm(true);

    loadInvoice();
  }, [editId]);

 
   

  async function loadInvoice() {
    try {
      setLoading(true);

      const existing =
        await getNewInvoiceById(editId);

      if (!existing) {
        alert("Invoice not found.");

        navigate(
          "/invoice/new-design"
        );

        return;
      }

      setInvoice({
        invoice_number:
          existing.invoice_number || "",

        invoice_date:
          existing.invoice_date
            ? existing.invoice_date.split("T")[0]
            : new Date()
                .toISOString()
                .split("T")[0],

        customer_name:
          existing.customer_name || "",

        customer_address:
          existing.customer_address || "",

        received:
          Number(
            existing.received || 0
          ),

        items:
          Array.isArray(existing.items)
            ? existing.items
            : [],
      });
    } catch (error) {
      console.error(
        "LOAD INVOICE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     CREATE NEW INVOICE
  ============================================================ */

  async function handleCreateInvoice() {
    try {
      setLoading(true);

      const invoiceNumber =
        await getNextNewInvoiceNumber();

      setInvoice({
        invoice_number:
          invoiceNumber,

        invoice_date:
          new Date()
            .toISOString()
            .split("T")[0],

        customer_name: "",
        customer_address: "",

        received: 0,

        items: [],
      });

      setItem({
        name: "",
        hsn: "",
        qty: 1,
        price: "",
        gst: "5",
      });

      setShowForm(true);

      navigate(
        "/invoice/new-design"
      );
    } catch (error) {
      console.error(
        "CREATE INVOICE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to create invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     CLOSE FORM
  ============================================================ */

  function closeForm() {
    setShowForm(false);

    setInvoice({
      invoice_number: "",
      invoice_date:
        new Date()
          .toISOString()
          .split("T")[0],

      customer_name: "",
      customer_address: "",

      received: 0,

      items: [],
    });

    setItem({
      name: "",
      hsn: "",
      qty: 1,
      price: "",
      gst: "5",
    });

    navigate(
      "/invoice/new-design"
    );
  }

  /* ============================================================
     INPUT HANDLERS
  ============================================================ */

  function handleInvoiceChange(e) {
    const {
      name,
      value,
    } = e.target;

    setInvoice((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

 function handleItemChange(e) {
  const { name, value } = e.target;

  if (name === "name") {
    const selectedProduct =
      inventoryProducts.find((product, index) => {
        const productName = String(
          product.product_name ||
            product.name ||
            ""
        ).trim();

        const company = String(
          product.company || ""
        ).trim();

        const specification = String(
          product.specification || ""
        ).trim();

        const length =
          product.length_ft
            ? `${product.length_ft}ft`
            : "";

        const category = String(
          product.category ||
            product.product_category ||
            ""
        )
          .trim()
          .toLowerCase();

        const isInverter =
          category.includes("inverter") ||
          productName
            .toLowerCase()
            .includes("inverter");

        const isPanel =
          category.includes("panel") ||
          productName
            .toLowerCase()
            .includes("panel");

        let label;

        if (
          isInverter &&
          company &&
          specification
        ) {
          label =
            `${company} Inverter ${specification}`;
        } else if (
          isPanel &&
          company &&
          specification
        ) {
          label =
            `${company} Panel ${specification}`;
        } else {
          label = [
            productName,
            company,
            specification,
            length,
          ]
            .filter(Boolean)
            .join(" - ");
        }

        return label === value;
      });

    if (!selectedProduct) {
      setItem((prev) => ({
        ...prev,
        name: value,
      }));

      return;
    }

    const category = String(
      selectedProduct.category ||
        selectedProduct.product_category ||
        ""
    )
      .trim()
      .toLowerCase();

    const productName = String(
      selectedProduct.product_name ||
        selectedProduct.name ||
        ""
    )
      .trim()
      .toLowerCase();

    const isInverter =
      category.includes("inverter") ||
      productName.includes("inverter");

    const isPanel =
      category.includes("panel") ||
      productName.includes("panel");

    setItem((prev) => ({
      ...prev,
      name: value,
      gst:
        isInverter || isPanel
          ? "5"
          : "18",
    }));

    return;
  }

  setItem((prev) => ({
    ...prev,
    [name]: value,
  }));
}

  /* ============================================================
     ADD ITEM
  ============================================================ */

  function addItem() {
    if (!item.name.trim()) {
      alert(
        "Please enter Item Name."
      );

      return;
    }

    if (
      !item.qty ||
      Number(item.qty) <= 0
    ) {
      alert(
        "Please enter valid quantity."
      );

      return;
    }

    if (
      item.price === "" ||
      Number(item.price) < 0
    ) {
      alert(
        "Please enter Unit Price."
      );

      return;
    }

    setInvoice((prev) => ({
      ...prev,

      items: [
        ...prev.items,

        {
          name: item.name,
          hsn: item.hsn,
          qty: Number(item.qty),
          price: Number(item.price),
          gst: Number(item.gst),
        },
      ],
    }));

    setItem({
      name: "",
      hsn: "",
      qty: 1,
      price: "",
      gst: "5",
    });
  }

  /* ============================================================
     DELETE ITEM
  ============================================================ */

  function deleteItem(index) {
    setInvoice((prev) => ({
      ...prev,

      items:
        prev.items.filter(
          (_, i) => i !== index
        ),
    }));
  }

  /* ============================================================
     CALCULATIONS
  ============================================================ */

  function calculateItem(currentItem) {
    const qty =
      Number(
        currentItem.qty || 0
      );

    const price =
      Number(
        currentItem.price || 0
      );

    const taxableAmount =
      qty * price;

    const gstRate =
      Number(
        currentItem.gst || 0
      );

    const cgstRate =
      gstRate / 2;

    const sgstRate =
      gstRate / 2;

    const cgst =
      taxableAmount *
      (cgstRate / 100);

    const sgst =
      taxableAmount *
      (sgstRate / 100);

    const amount =
      taxableAmount +
      cgst +
      sgst;

    return {
      taxableAmount,
      cgstRate,
      sgstRate,
      cgst,
      sgst,
      amount,
    };
  }

  const calculatedItems =
    invoice.items.map(
      (currentItem) => ({
        ...currentItem,

        ...calculateItem(
          currentItem
        ),
      })
    );

  const subtotal =
    calculatedItems.reduce(
      (sum, currentItem) =>
        sum +
        currentItem.taxableAmount,
      0
    );

  const totalCGST =
    calculatedItems.reduce(
      (sum, currentItem) =>
        sum +
        currentItem.cgst,
      0
    );

  const totalSGST =
    calculatedItems.reduce(
      (sum, currentItem) =>
        sum +
        currentItem.sgst,
      0
    );

  const total =
    subtotal +
    totalCGST +
    totalSGST;

  const received =
    Number(
      invoice.received || 0
    );

  const balance =
    total - received;

  /* ============================================================
     TAX SUMMARY
  ============================================================ */

  function getTaxSummary() {
    const summary = [];

    const rates = [
      2.5,
      9,
    ];

    rates.forEach((rate) => {
      const taxable =
        calculatedItems
          .filter(
            (currentItem) =>
              currentItem.cgstRate ===
                rate &&
              currentItem.sgstRate ===
                rate
          )
          .reduce(
            (sum, currentItem) =>
              sum +
              currentItem.taxableAmount,
            0
          );

      if (taxable > 0) {
        summary.push({
          type: "SGST",
          taxable,
          rate,
          tax:
            taxable *
            (rate / 100),
        });

        summary.push({
          type: "CGST",
          taxable,
          rate,
          tax:
            taxable *
            (rate / 100),
        });
      }
    });

    return summary;
  }

  const taxSummary =
    getTaxSummary();

  /* ============================================================
     SAVE / UPDATE
  ============================================================ */

  async function handleSave() {
    if (
      !invoice.customer_name.trim()
    ) {
      alert(
        "Please select Customer Name."
      );

      return;
    }

    if (
      !invoice.invoice_number.trim()
    ) {
      alert(
        "Please enter Invoice Number."
      );

      return;
    }

    if (
      invoice.items.length === 0
    ) {
      alert(
        "Please add at least one item."
      );

      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...invoice,

        total,
        subtotal,
        received,
        balance,

        items:
          invoice.items,
      };

      if (editId) {
        await updateNewInvoice(
          editId,
          payload
        );

        alert(
          "Invoice updated successfully."
        );
      } else {
        await saveNewInvoice(
          payload
        );

        alert(
          "Invoice created successfully."
        );
      }

      await loadNewInvoices();

      closeForm();
    } catch (error) {
      console.error(
        "SAVE INVOICE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     DELETE INVOICE
  ============================================================ */

  async function handleDeleteInvoice(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this invoice?"
      );

    if (!confirmed) return;

    try {
      setLoading(true);

      await deleteNewInvoice(id);

      await loadNewInvoices();

      alert(
        "Invoice deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE INVOICE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     VIEW INVOICE
  ============================================================ */

  function handleViewInvoice(id) {
    navigate(
      `/invoice/new-design?id=${id}&view=1`
    );
  }

  /* ============================================================
     PDF INVOICE
  ============================================================ */

  async function handleDownloadPDF(id) {
  try {
    setLoading(true);

    const invoiceData =
      await getNewInvoiceById(id);

    if (!invoiceData) {
      throw new Error(
        "Invoice not found."
      );
    }

    setInvoice({
      invoice_number:
        invoiceData.invoice_number || "",

      invoice_date:
        invoiceData.invoice_date
          ? invoiceData.invoice_date.split("T")[0]
          : "",

      customer_name:
        invoiceData.customer_name || "",

      customer_address:
        invoiceData.customer_address || "",

      received:
        Number(
          invoiceData.received || 0
        ),

      items:
        Array.isArray(invoiceData.items)
          ? invoiceData.items
          : [],
    });

    // Wait for React to render the invoice
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

    await generateNewInvoicePDF(invoiceData.customer_name || "Customer");

  } catch (error) {
    console.error(
      "PDF DOWNLOAD ERROR:",
      error
    );

    alert(
      error?.message ||
        "Failed to download PDF."
    );
  } finally {
    setLoading(false);
  }
}
  /* ============================================================
     EDIT INVOICE
  ============================================================ */

  function handleEditInvoice(id) {
    navigate(
      `/invoice/new-design?id=${id}`
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <>
  
<style>
  {`
    #new-invoice-pdf-document {
      page-break-inside: auto;
    }

    
/* Center all table headers and cell data */
#new-invoice-pdf-document .print-table th,
#new-invoice-pdf-document .print-table td {
  text-align: center !important;
  vertical-align: middle !important;
}

/* Center the contents of each table row */
#new-invoice-pdf-document .print-table tr,
#new-invoice-pdf-document .print-table tbody {
  vertical-align: middle !important;
}

/* Center nested content inside cells */
#new-invoice-pdf-document .print-table th *,
#new-invoice-pdf-document .print-table td * {
  vertical-align: middle !important;
}

/* Prevent rows from splitting across PDF pages */
#new-invoice-pdf-document .print-no-break {
  break-inside: avoid;
  page-break-inside: avoid;
}


    #new-invoice-pdf-document .print-section {
      break-inside: auto;
      page-break-inside: auto;
    }

    #new-invoice-pdf-document .print-table {
      width: 100% !important;
      table-layout: fixed !important;
      page-break-inside: auto;
    }

    /* Unit Price column — 5th column */
#new-invoice-pdf-document .print-table th:nth-child(5),
#new-invoice-pdf-document .print-table td:nth-child(5) {
  width: 9% !important;
  min-width: 0 !important;
  max-width: 9% !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
  white-space: nowrap !important;
}

/* Amount column — 6th column */
#new-invoice-pdf-document .print-table th:nth-child(6),
#new-invoice-pdf-document .print-table td:nth-child(6) {
  width: 8% !important;
  min-width: 0 !important;
  max-width: 8% !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
}

/* CGST column — 7th column */
#new-invoice-pdf-document .print-table th:nth-child(7),
#new-invoice-pdf-document .print-table td:nth-child(7) {
  width: 12% !important;
  min-width: 0 !important;
  max-width: 12% !important;
  padding-left: 3px !important;
  padding-right: 3px !important;
}

/* SGST column — 8th column */
#new-invoice-pdf-document .print-table th:nth-child(8),
#new-invoice-pdf-document .print-table td:nth-child(8) {
  width: 12% !important;
  min-width: 0 !important;
  max-width: 12% !important;
  padding-left: 3px !important;
  padding-right: 3px !important;
}

    #new-invoice-pdf-document .print-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #new-invoice-pdf-document .print-table thead {
      display: table-header-group;
    }

    #new-invoice-pdf-document .print-table tfoot {
      display: table-footer-group;
    }
  `}
</style>

     

      {/* ========================================================
    PDF DOCUMENT
    USED FOR GENERATING THE NEW INVOICE PDF
======================================================== */}

      <div
  id="new-invoice-pdf-document"
  data-invoice-number={
    invoice.invoice_number || "invoice"
  }
  className="
    fixed
    left-[-10000px]
    top-0
    w-[794px]
    bg-white
    text-black
  "
>

        {/* ======================================================
            COMPANY HEADER
        ====================================================== */}

        <div
          className="
            border
            border-black
            mb-3
            print-no-break
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              px-5
              py-4
            "
          >

            {/* LOGO + COMPANY DETAILS */}

            <div className="flex items-center gap-5">

              <div className="flex-shrink-0">

                <img
                  src="/logo.png"
                  alt="Shiv Shakti Solar Energy"
                  className="
                    w-24
                    h-24
                    object-contain
                  "
                />

              </div>


              <div>

                <h1
                  className="
                    text-2xl
                    font-bold
                    mb-1
                  "
                >
                  Shiv Shakti Solar Energy
                </h1>

                <p className="text-sm">
                  Flat no.: 01, Ward no. 7,
                  Opp. Stadium
                </p>

                <p className="text-sm">
                  Nowgong, Distt.: Chhatarpur (MP)
                </p>

                <p className="text-sm">
                  Contact No.: 9406731278
                </p>

                <p className="text-sm">
                  Email: shivshaktienergies01@gmail.com
                </p>

                <p className="text-sm font-semibold">
                  GST No.: 23BECPD8921G1ZV
                </p>

              </div>

            </div>


            {/* TAX INVOICE */}

            <div className="text-center">

              <h2
                className="
                  text-3xl
                  font-bold
                  uppercase
                  tracking-wide
                "
              >
                Tax Invoice
              </h2>

            </div>

          </div>

        </div>


        {/* ======================================================
            BILL TO + INVOICE DETAILS
        ====================================================== */}

        <div
          className="
            grid
            grid-cols-2
            border
            border-black
            mb-4
            print-no-break
          "
        >

          {/* BILL TO */}

          <div
            className="
              border-r
              border-black
              p-4
              min-h-[105px]
            "
          >

            <h3
              className="
                font-bold
                text-base
                mb-2
              "
            >
              Bill To:
            </h3>

            <div className="font-semibold text-sm">
              {invoice.customer_name || "-"}
            </div>

            {invoice.customer_address && (
              <div
                className="
                  mt-1
                  text-sm
                  whitespace-pre-line
                  leading-5
                "
              >
                {invoice.customer_address}
              </div>
            )}

          </div>


          {/* INVOICE DETAILS */}

          <div
            className="
              p-4
              min-h-[105px]
            "
          >

            <h3
              className="
                font-bold
                text-base
                mb-2
              "
            >
              Invoice Details:
            </h3>

            <div className="text-sm leading-6">

              <div>
                <span className="font-semibold">
                  Invoice No.:
                </span>{" "}
                {invoice.invoice_number || "-"}
              </div>

              <div>
                <span className="font-semibold">
                  Date:
                </span>{" "}
                {invoice.invoice_date
                  ? formatInvoiceDate(
                      invoice.invoice_date
                    )
                  : "-"}

              </div>

            </div>

          </div>

        </div>


        {/* ======================================================
            ITEM TABLE
        ====================================================== */}

        <div
          className="
            mb-4
            print-section
          "
        >

  <table
  className="
    w-full
    text-center
    align-middle
    font-semibold
    border-collapse
    border
    border-black
    text-[11px]
    print-table
  "
  
style={{
  textAlign: "center",
  verticalAlign: "middle",
  tableLayout: "fixed",
  width: "100%",
}}

>

            <thead>

              <tr>

                <th
                className="
  px-2
  py-2
  text-center
  border
  border-black
  bg-gray-100
  w-[5%]
"
                >
                  #
                </th>

               <th
  className="
  px-2
  py-2
  text-center
  align-middle
  font-bold
  border
  border-black
  bg-gray-100
  w-[20%]
"
>
  Item Name
</th>

                <th
                  className="
                    px-2
                    py-2
                    text-center
                    align-middle
                    border
                    border-black
                    bg-gray-100
                    w-[10%]
                  "
                >
                  HSN/SAC
                </th>

                <th
                  className="
                    px-2
                    py-2
                    text-center
                    align-middle
                    border
                    border-black
                    bg-gray-100
                    w-[7%]
                  "
                >
                  Qty
                </th>

                

<th
  style={{
    width: "8%",
    minWidth: 0,
    maxWidth: "8%",
  }}
  className="
    px-1
    py-2
    text-center
    align-middle
    border
    border-black
    bg-gray-100
    whitespace-nowrap
  "
>
  Unit Price
</th>


                
<th
  style={{ width: "8%" }}
  className="
    px-1
    py-2
    text-center
    align-middle
    border
    border-black
    bg-gray-100
    whitespace-nowrap
  "
>
  Amount
</th>


                <th
  className="
    px-2
    py-2
    text-center
    align-middle
    border
    border-black
    bg-gray-100
    w-[10%]
    whitespace-nowrap
  "
>
  CGST
</th>

                <th
  className="
    px-2
    py-2
    text-center
    align-middle
    border
    border-black
    bg-gray-100
    w-[10%]
    whitespace-nowrap
  "
>
  SGST
</th>

                <th
                  className="
                    px-2
                    py-2
                    text-center
                    align-middle
                    border
                    border-black
                    bg-gray-100
                    w-[10%]
                  "
                >
                  Amount
                </th>

              </tr>

            </thead>


            <tbody
  style={{
    textAlign: "center",
    verticalAlign: "middle",
  }}
>

              {calculatedItems.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="
                      p-5
                      text-center
                      border
                      border-black
                    "
                  >
                    No items added.
                  </td>

                </tr>

              ) : (

                calculatedItems.map(
                  (
                    currentItem,
                    index
                  ) => (

                    <tr key={index}>

                      <td
                        className="
                          px-2
                          py-2
                          text-center
                          border
                          border-black
                        "
                      >
                        {index + 1}
                      </td>

                      <td
  className="
    px-2
    py-2
    text-center
    align-middle
    border
    border-black
  "
>
  {currentItem.name
  ?.replace(/\s*9ft\s*-\s*9ft\s*/gi, "")
  ?.replace(/140\s*x\s*50\s*x\s*2\s*mm/gi, "140 * 50 * 2mm")}
</td>

                      <td
                        className="
                          px-2
                          py-2
                          text-center
                          border
                          border-black
                        "
                      >
                        {currentItem.hsn}
                      </td>

                      <td
                        className="
                          px-2
                          py-2
                          text-center
                          border
                          border-black
                        "
                      >
                        {currentItem.qty}
                      </td>

                      
<td
  style={{ width: "10%" }}
  className="
    px-1
    py-2
    text-center
    align-middle
    border
    border-black
    whitespace-nowrap
  "
>
  ₹
  {Number(currentItem.price || 0).toFixed(2)}
</td>


<td
  style={{ width: "8%" }}
  className="
    px-1
    py-2
    text-center
    border
    border-black
    whitespace-nowrap
  "
>
  ₹
  {Number(
    currentItem.amount ??
    currentItem.taxableAmount ??
    0
  ).toFixed(2)}
</td>


                      <td
                        className="
                          px-2
                          py-2
                          text-center
                          border
                          border-black
                          whitespace-nowrap
                        "
                      >
                        {currentItem.cgstRate}%
                        {" / ₹"}
                        {currentItem.cgst.toFixed(
                          2
                        )}
                      </td>

                      <td
                        className="
                          px-2
                          py-2
                          text-center
                          border
                          border-black
                          
                        "
                      >
                        {currentItem.sgstRate}%
                        {" / ₹"}
                        {currentItem.sgst.toFixed(
                          2
                        )}
                      </td>

                     <td
  className="
    px-2
    py-2
    text-center
    font-semibold
    border
    border-black
  "
>
                        ₹
                        {currentItem.amount.toFixed(
                          2
                        )}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* ======================================================
            TAX SUMMARY + AMOUNTS
        ====================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-0
            bg-white
            border
            border-black
            mb-4
            text-center
            align-middle
            print-no-break
          "
        >

          {/* TAX SUMMARY */}

          <div
            className="
              border-r
              border-black
            "
          >

            <div
              className="
                bg-gray-100
                border-b
                border-black
                px-4
                py-2
                font-bold
              "
            >
              Tax Summary
            </div>

            <table
              className="
                w-full
                border-collapse
                text-sm
                text-center
align-middle
              "
            >

              <thead>

                <tr>

                  <th
                    className="
                      border
                      border-black
                      px-2
                      py-2
                    "
                  >
                    Tax Type
                  </th>

                  <th
                    className="
                      border
                      border-black
                      px-2
                      py-2
                    "
                  >
                    Amount
                  </th>

                  <th
                    className="
                      border
                      border-black
                      px-2
                      py-2
                    "
                  >
                    Rate
                  </th>

                  <th
                    className="
                      border
                      border-black
                      px-2
                      py-2
                    "
                  >
                    Tax Amount
                  </th>

                </tr>

              </thead>


              <tbody>

                {taxSummary.length === 0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="
                        border
                        border-black
                        px-2
                        py-4
                        text-center
                        text-gray-500
                      "
                    >
                      No tax calculated.
                    </td>

                  </tr>

                ) : (

                  taxSummary.map(
                    (tax, index) => (

                      <tr key={index}>

                        <td
                          className="
                            border
                            border-black
                            px-2
                            py-2
                            text-center
                          "
                        >
                          {tax.type}
                        </td>

                        <td
                          className="
                            border
                            border-black
                            px-2
                            py-2
                            text-center
                          "
                        >
                          ₹
                          {tax.taxable.toFixed(
                            2
                          )}
                        </td>

                        <td
                          className="
                            border
                            border-black
                            px-2
                            py-2
                            text-center
                          "
                        >
                          {tax.rate}%
                        </td>

                        <td
                          className="
                            border
                            border-black
                            px-2
                            py-2
                            text-center
                          "
                        >
                          ₹
                          {tax.tax.toFixed(
                            2
                          )}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          {/* AMOUNTS */}

          <div>

            <div
              className="
                bg-gray-100
                border-b
                border-black
                px-4
                py-2
                font-bold
              "
            >
              Amounts
            </div>

            <table
              className="
                w-full
                border-collapse
                text-sm
              "
            >

              <tbody>

                <tr>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      font-semibold
                    "
                  >
                    Sub Total
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      text-center
                    "
                  >
                    ₹
                    {subtotal.toFixed(2)}
                  </td>

                </tr>


                <tr>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      font-semibold
                    "
                  >
                    Amount
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      text-center
                      font-bold
                    "
                  >
                    ₹
                    {total.toFixed(2)}
                  </td>

                </tr>


                <tr>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      font-semibold
                    "
                  >
                    Received
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      text-center
                    "
                  >
                    ₹
                    {received.toFixed(2)}
                  </td>

                </tr>


                <tr>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      font-semibold
                    "
                  >
                    Balance
                  </td>

                  <td
                    className="
                      border
                      border-black
                      px-3
                      py-2
                      text-center
                      font-bold
                    "
                  >
                    ₹
                    {balance.toFixed(2)}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>


        {/* ======================================================
            AMOUNT IN WORDS
        ====================================================== */}

        <div
          className="
            bg-white
            border
            border-black
            px-4
            py-3
            mb-4
            print-no-break
          "
        >

          <div className="font-bold">
            Invoice Amount In Words
          </div>

          <div className="mt-1">
            {numberToWordsIndian(total)}
          </div>

        </div>


        {/* ======================================================
            BANK / TERMS / SIGNATURE
        ====================================================== */}

        <div
          className="
            grid
            grid-cols-3
            bg-white
            border
            border-black
            mb-4
            print-no-break
          "
        >

          {/* BANK DETAILS */}

          <div
            className="
              border-r
              border-black
              p-4
              min-h-[180px]
            "
          >

            <h3 className="font-bold mb-4">
              Bank Details :
            </h3>

            <div
              className="
                text-sm
                font-bold
                text-black
                leading-6
              "
            >

              <p>
                <span className="font-bold text-gray-800">
                  Bank Name:
                </span>{" "}
                Canara Bank
              </p>

              <p>
                <span className="font-bold text-gray-800">
                  Account Name:
                </span>{" "}
                Shiv Shakti Solar Energy
              </p>

              <p>
                <span className="font-bold text-gray-800">
                  Account No.:
                </span>{" "}
                120040318797
              </p>

              <p>
                <span className="font-bold text-gray-800">
                  IFSC:
                </span>{" "}
                CNRB0017736
              </p>

              <p>
                <span className="font-bold text-gray-800">
                  Branch:
                </span>{" "}
                NOWGONG
              </p>

            </div>

          </div>


          {/* TERMS */}

          <div
            className="
              border-r
              border-black
              p-4
              min-h-[180px]
            "
          >

            <h3 className="font-bold mb-3">
              Terms And Condition :
            </h3>

            <p
              className="
                text-xs
                font-semibold
                text-black
                mt-2
                leading-4
              "
            >
              System Ownership: Customer owns the
              solar panels and inverter after full
              payment, Grid Connection: Customer
              must obtain necessary approvals from
              local electricity board, Net Metering:
              Excess energy exported to grid credited
              as per utility police, Tariff Charges:
              Customer acknowledges that government
              tariff policies may change, Product
              Warranty: As per company norms, Firm/Owner
              should not be liable for any type of
              damage, Exclusion: Damage due to misuse,
              natural disaster or unauthorized
              modifications not covered.
              "All solar installations, services and
              jurisdictional matters will be governed
              within the area of Chhatarpur [M.P.] only."
            </p>

          </div>


          {/* SIGNATURE */}

          <div
            className="
              p-4
              min-h-[180px]
              text-center
            "
          >

            <h3 className="font-bold">
              For Shiv Shakti Solar Energy
            </h3>

            <div
              className="
                h-44
                flex
                items-center
                justify-center
              "
            >
            </div>

            <div className="font-bold">
              Authorized Signatory
            </div>

          </div>

        </div>

      </div>


      {/* ========================================================
          NORMAL SCREEN UI
      ======================================================== */}

      <div
        className="
          screen-only
          min-h-screen
          bg-gray-100
          p-6
          text-gray-900
        "
      >

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div
          className="
            rounded-2xl
            shadow-sm
            mb-6
            p-6
            text-white
            bg-gradient-to-r
            from-blue-600
            via-purple-600
            to-pink-500
          "
        >

          <div className="flex justify-between items-center">

            <div>

              <h1 className="text-3xl font-bold">
                New Invoice
              </h1>

              <p className="text-blue-100 mt-1">
                Manage GST invoices
              </p>

            </div>


            

          </div>

        </div>


        {/* ======================================================
            CREATE INVOICE BUTTON
        ====================================================== */}

        {!showForm && (

          <div
            className="
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-gray-200
              p-5
              mb-6
            "
          >

            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={loading}
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-5
                py-2.5
                rounded-lg
                font-bold
                disabled:opacity-50
              "
            >

              <Plus
                size={18}
                className="inline mr-2"
              />

              Create Invoice

            </button>

          </div>

        )}


        {/* ======================================================
            INVOICE LIST
        ====================================================== */}

        {!showForm && (

          <div
            className="
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-gray-200
              overflow-hidden
            "
          >

            <div
              className="
                px-5
                py-4
                border-b
                border-gray-200
              "
            >

              <h2 className="text-lg font-bold">
                Created Invoices
              </h2>

            </div>


            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  border-collapse
                  text-sm
                  border
                  border-black
                "
              >

                <thead
                  className="
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    text-center
                  "
                >

                  <tr>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-white
                        border
                        border-black
                      "
                    >
                      Invoice No.
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-white
                        border
                        border-black
                      "
                    >
                      Date
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-white
                        border
                        border-black
                      "
                    >
                      Customer
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-white
                        border
                        border-black
                      "
                    >
                      Amount
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        font-semibold
                        text-white
                        border
                        border-black
                      "
                    >
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {loadingInvoices ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="
                          px-4
                          py-8
                          text-center
                          text-gray-500
                        "
                      >
                        Loading invoices...
                      </td>

                    </tr>

                  ) : newInvoices.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="
                          px-4
                          py-10
                          text-center
                          text-gray-500
                        "
                      >
                        No invoices created yet.
                      </td>

                    </tr>

                  ) : (

                    newInvoices.map(
                      (currentInvoice) => (

                        <tr
                          key={currentInvoice.id}
                          className="
                            border
                            border-black
                            hover:bg-gray-50
                          "
                        >

                          <td
                            className="
                              px-4
                              py-3
                              text-center
                              border
                              border-black
                            "
                          >
                            {
                              currentInvoice.invoice_number
                            }
                          </td>


                          <td
                            className="
                              px-4
                              py-3
                              text-center
                              border
                              border-black
                            "
                          >
                            {
                              currentInvoice.invoice_date
                                ? formatInvoiceDate(
                                    currentInvoice.invoice_date
                                  )
                                : "-"
                            }
                          </td>


                          <td
                            className="
                              px-4
                              py-3
                              text-center
                              border
                              border-black
                            "
                          >
                            {
                              currentInvoice.customer_name ||
                              "-"
                            }
                          </td>


                          <td
                            className="
                              px-4
                              py-3
                              text-center
                              border
                              border-black
                            "
                          >
                            ₹
                            {Number(
                              currentInvoice.total || 0
                            ).toFixed(2)}
                          </td>


                          <td
                            className="
                              px-4
                              py-3
                              text-center
                              border
                              border-black
                            "
                          >

                            <div
                              className="
                                flex
                                justify-center
                                items-center
                                gap-2
                              "
                            >

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewInvoice(
                                    currentInvoice.id
                                  )
                                }
                                title="View Invoice"
                                className="
                                  p-2
                                  rounded-lg
                                  text-blue-600
                                  hover:bg-blue-50
                                "
                              >
                                <Eye size={17} />
                              </button>


                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditInvoice(
                                    currentInvoice.id
                                  )
                                }
                                title="Edit Invoice"
                                className="
                                  p-2
                                  rounded-lg
                                  text-green-600
                                  hover:bg-green-50
                                "
                              >
                                <Pencil size={17} />
                              </button>


                              {/* PDF */}
<button
  type="button"
  onClick={() =>
    handleDownloadPDF(
      currentInvoice.id
    )
  }
  title="Download PDF"
  className="
    p-2
    rounded-lg
    text-green-600
    hover:bg-green-50
  "
>
  <Download size={17} />
</button>


                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteInvoice(
                                    currentInvoice.id
                                  )
                                }
                                title="Delete Invoice"
                                className="
                                  p-2
                                  rounded-lg
                                  text-red-600
                                  hover:bg-red-50
                                "
                              >
                                <Trash2 size={17} />
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* ======================================================
            INVOICE FORM
        ====================================================== */}

        {showForm && (

          <>

            {/* FORM HEADER */}

            <div
              className="
                flex
                justify-between
                items-center
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-200
                p-4
                mb-6
              "
            >

              <div>

                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  {viewMode
                    ? "View Invoice"
                    : editId
                      ? "Edit Invoice"
                      : "Create Invoice"}
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    mt-1
                  "
                >
                  Invoice No.{" "}
                  {invoice.invoice_number || "-"}
                </p>

              </div>


              <button
                type="button"
                onClick={closeForm}
                className="
                  px-4
                  py-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  font-semibold
                  hover:bg-gray-50
                "
              >

                <X
                  size={17}
                  className="inline mr-2"
                />

                Close

              </button>

            </div>


            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div
              className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-200
                p-5
                mb-6
              "
            >

              <h2
                className="
                  text-lg
                  font-bold
                  mb-4
                "
              >
                Invoice Details
              </h2>


              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  lg:grid-cols-4
                  gap-4
                "
              >

                {/* INVOICE NUMBER */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      mb-1
                    "
                  >
                    Invoice Number
                  </label>

                  <input
                    name="invoice_number"
                    value={
                      invoice.invoice_number
                    }
                    readOnly
                    className="
                      w-full
                      border
                      rounded-lg
                      px-3
                      py-2
                      bg-gray-100
                      outline-none
                    "
                  />

                </div>


                {/* DATE */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      mb-1
                    "
                  >
                    Invoice Date
                  </label>

                  <input
                    type="date"
                    name="invoice_date"
                    value={
                      invoice.invoice_date
                    }
                    onChange={
                      handleInvoiceChange
                    }
                    disabled={viewMode}
                    className="
                      w-full
                      border
                      rounded-lg
                      px-3
                      py-2
                      outline-none
                      focus:ring-2
                      focus:ring-blue-400
                      disabled:bg-gray-100
                    "
                  />

                </div>


                {/* CUSTOMER */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      mb-1
                    "
                  >
                    Customer Name
                  </label>

                  <select
                    value={
                      invoice.customer_name
                    }
                    onChange={(e) => {

                      const selectedName =
                        e.target.value;

                      const selectedCustomer =
                        customers.find(
                          (customer) =>
                            String(
                              customer.name ||
                                customer.customer_name ||
                                ""
                            ).trim() ===
                            selectedName
                        );

                      const address =
                        selectedCustomer
                          ? getCustomerFullAddress(
                              selectedCustomer
                            )
                          : "";

                      setInvoice((prev) => ({
                        ...prev,

                        customer_name:
                          selectedName,

                        customer_address:
                          address,
                      }));

                    }}
                    disabled={
                      loadingCustomers ||
                      viewMode
                    }
                    className="
                      w-full
                      border
                      rounded-lg
                      px-3
                      py-2
                      outline-none
                      bg-white
                      focus:ring-2
                      focus:ring-blue-400
                      disabled:bg-gray-100
                    "
                  >

                    <option value="">
                      {loadingCustomers
                        ? "Loading customers..."
                        : "Select Customer"}
                    </option>


                    {customers.map(
                      (customer) => {

                        const customerName =
                          customer.name ||
                          customer.customer_name ||
                          "";

                        return (

                          <option
                            key={customer.id}
                            value={customerName}
                          >
                            {customerName}
                          </option>

                        );

                      }
                    )}


                    {invoice.customer_name &&
                      !customers.some(
                        (customer) =>
                          String(
                            customer.name ||
                              customer.customer_name ||
                              ""
                          ).trim() ===
                          invoice.customer_name
                      ) && (

                        <option
                          value={
                            invoice.customer_name
                          }
                        >
                          {invoice.customer_name}
                        </option>

                      )}

                  </select>

                </div>


                {/* RECEIVED */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      mb-1
                    "
                  >
                    Received Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      invoice.received
                    }
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,

                        received:
                          e.target.value,
                      }))
                    }
                    disabled={viewMode}
                    className="
                      w-full
                      border
                      rounded-lg
                      px-3
                      py-2
                      outline-none
                      focus:ring-2
                      focus:ring-blue-400
                      disabled:bg-gray-100
                    "
                  />

                </div>

              </div>


              {/* ADDRESS */}

              <div className="mt-4">

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    mb-1
                  "
                >
                  Customer Address
                </label>

                <textarea
                  name="customer_address"
                  value={
                    invoice.customer_address
                  }
                  onChange={(e) => {

                    const value =
                      e.target.value
                        .replace(
                          /\r\n/g,
                          "\n"
                        )
                        .replace(
                          /\n{2,}/g,
                          "\n"
                        );

                    handleInvoiceChange({
                      target: {
                        name:
                          "customer_address",

                        value,
                      },
                    });

                  }}
                  rows={3}
                  disabled={viewMode}
                  className="
                    w-full
                    border
                    rounded-lg
                    px-3
                    py-2
                    outline-none
                    focus:ring-2
                    focus:ring-blue-400
                    text-sm
                    leading-[20px]
                    resize-none
                    whitespace-pre-wrap
                    disabled:bg-gray-100
                  "
                />

              </div>

            </div>


            {/* ==================================================
                ADD ITEM
            ================================================== */}

            {!viewMode && (

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-sm
                  border
                  border-gray-200
                  p-5
                  mb-6
                "
              >

                <h2
                  className="
                    text-lg
                    font-bold
                    mb-4
                  "
                >
                  Add Item
                </h2>


                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    lg:grid-cols-6
                    gap-3
                    items-end
                  "
                >

                  {/* ITEM NAME */}

                  <div className="lg:col-span-2">

                    <label
                      className="
                        block
                        text-sm
                        font-semibold
                        mb-1
                      "
                    >
                      Item
                    </label>

                   <select
  name="name"
 value={item.name 
  ?.replace(/\s*9ft\s*-\s*9ft\s*/gi, "") 
  ?.replace(/140\s*x\s*50\s*x\s*2\s*mm/gi, "140 * 50 * 2mm")}
  onChange={handleItemChange}
  disabled={loadingProducts}
  className="
    w-full
    border
    rounded-lg
    px-3
    py-2
    bg-white
    outline-none
    focus:ring-2
    focus:ring-blue-400
    disabled:bg-gray-100
  "
>
  <option value="">
    {loadingProducts
      ? "Loading products..."
      : "Select Product"}
  </option>

  {inventoryProducts.map(
    (product, index) => {
      const productName =
        String(
          product.product_name ||
            product.name ||
            ""
        ).trim();

      if (!productName) {
        return null;
      }

      const company =
        String(
          product.company || ""
        ).trim();

      const specification =
        String(
          product.specification || ""
        ).trim();

      const length =
        product.length_ft
          ? `${product.length_ft}ft`
          : "";

     const category = String(
  product.category ||
    product.product_category ||
    ""
).trim().toLowerCase();

let label;

const isInverter =
  category.includes("inverter") ||
  productName.toLowerCase().includes("inverter");

const isPanel =
  category.includes("panel") ||
  productName.toLowerCase().includes("panel");

if (
  isInverter &&
  company &&
  specification
) {
  label = `${company} Inverter ${specification}`;
} else if (
  isPanel &&
  company &&
  specification
) {
  label = `${company} Panel ${specification}`;
} else {
  const labelParts = [
    productName,
    company,
    specification,
    length,
  ].filter(Boolean);

  label = labelParts.join(" - ");
}

      return (
       <option
  key={
    product.id ||
    `${label}-${index}`
  }
  value={label}
>
  {label}
</option>
      );
    }
  )}
</select>

                  </div>


                  {/* HSN */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-semibold
                        mb-1
                      "
                    >
                      HSN/SAC
                    </label>

                    <input
                      name="hsn"
                      value={item.hsn}
                      onChange={
                        handleItemChange
                      }
                      placeholder="HSN/SAC"
                      className="
                        w-full
                        border
                        rounded-lg
                        px-3
                        py-2
                      "
                    />

                  </div>


                  {/* QTY */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-semibold
                        mb-1
                      "
                    >
                      Qty
                    </label>

                    <input
                      type="number"
                      min="1"
                      name="qty"
                      value={item.qty}
                      onChange={
                        handleItemChange
                      }
                      className="
                        w-full
                        border
                        rounded-lg
                        px-3
                        py-2
                      "
                    />

                  </div>


                  {/* PRICE */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-semibold
                        mb-1
                      "
                    >
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="price"
                      value={item.price}
                      onChange={
                        handleItemChange
                      }
                      placeholder="0.00"
                      className="
                        w-full
                        border
                        rounded-lg
                        px-3
                        py-2
                      "
                    />

                  </div>


                  {/* GST */}

                  <div>

                    <label
                      className="
                        block
                        text-sm
                        font-semibold
                        mb-1
                      "
                    >
                      GST
                    </label>

                    <select
  name="gst"
  value={item.gst}
  onChange={handleItemChange}
  disabled={!item.name}
  className="
    w-full
    border
    rounded-lg
    px-3
    py-2
    bg-gray-100
    cursor-not-allowed
  "
>

                      <option value="5">
                        5% (2.5% + 2.5%)
                      </option>

                      <option value="18">
                        18% (9% + 9%)
                      </option>

                    </select>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={addItem}
                  className="
                    mt-4
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    px-4
                    py-2
                    rounded-lg
                    font-semibold
                  "
                >

                  <Plus
                    size={17}
                    className="inline mr-1"
                  />

                  Add Item

                </button>

              </div>

            )}


            {/* ==================================================
                ITEM TABLE
            ================================================== */}

            <div
              className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-200
                overflow-hidden
                mb-6
              "
            >

              <div className="overflow-x-auto">

                
<table
  className="
    w-full
    text-center
    font-semibold
    border-collapse
    border
    border-black
    text-sm
    table-fixed
  "
  style={{ width: "100%", tableLayout: "fixed" }}
>
  <colgroup>
    <col style={{ width: "4%" }} />
    <col style={{ width: "22%" }} />
    <col style={{ width: "9%" }} />
    <col style={{ width: "6%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "9%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "13%" }} />
  </colgroup>


                  <thead
                    className="
                      bg-gradient-to-r
                      from-blue-600
                      to-indigo-600
                    "
                  >

                    <tr>

                      {[
                        "#",
                        "Item Name",
                        "HSN/SAC",
                        "Qty",
                        "Unit Price/Unit",
                        "Amount",
                        "CGST",
                        "SGST",
                        "Total",
                      ].map(
                        (header) => (

                          <th
                            key={header}
                            className="
                              px-2
                              py-2
                              text-center
                              text-xs
                              font-semibold
                              text-white
                              border
                              border-black
                              whitespace-nowrap
                            "
                          >
                            {header}
                          </th>

                        )
                      )}

                    </tr>

                  </thead>


                  <tbody>

                    {calculatedItems.length === 0 ? (

                      <tr>

                        <td
                          colSpan="9"
                          className="
                            p-8
                            text-center
                            text-gray-500
                            border
                            border-black
                          "
                        >
                          No items added.
                        </td>

                      </tr>

                    ) : (

                      calculatedItems.map(
                        (
                          currentItem,
                          index
                        ) => (

                          <tr
                            key={index}
                            className={
                              index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50"
                            }
                          >

                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {index + 1}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                              "
                            >
                              {
  currentItem.name
    ?.replace(/\s*9ft\s*-\s*9ft\s*/gi, "")
    ?.replace(/140\s*x\s*50\s*x\s*2\s*mm/gi, "140 * 50 * 2mm")
}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {
                                currentItem.hsn
                              }
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {
                                currentItem.qty
                              }
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              ₹
                              {Number(
                                currentItem.price
                              ).toFixed(2)}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              ₹
                              {Number(currentItem.amount || 0).toFixed(2)}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {
                                currentItem.cgstRate
                              }%
                              {" / ₹"}
                              {currentItem.cgst.toFixed(
                                2
                              )}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {
                                currentItem.sgstRate
                              }%
                              {" / ₹"}
                              {currentItem.sgst.toFixed(
                                2
                              )}
                            </td>


                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                                font-semibold
                              "
                            >

                              ₹
                              {currentItem.amount.toFixed(
                                2
                              )}


                              {!viewMode && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteItem(
                                      index
                                    )
                                  }
                                  className="
                                    ml-2
                                    text-red-600
                                    hover:text-red-800
                                  "
                                  title="Delete Item"
                                >

                                  <Trash2
                                    size={15}
                                    className="inline"
                                  />

                                </button>

                              )}

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div
              className="
                grid
                grid-cols-1
                lg:grid-cols-2
                gap-0
                bg-white
                border
                border-black
                mb-6
              "
            >

              {/* TAX SUMMARY */}

              <div
                className="
                  border-r
                  border-black
                text-center
                "
              >

                <div
                  className="
                    bg-gray-100
                    border-b
                    border-black
                    px-4
                    py-2
                    font-bold
                  "
                >
                  Tax Summary
                </div>


                <table
                  className="
                    w-full
                    border-collapse
                    text-sm
                  "
                >

                  <thead>

                    <tr>

                      <th
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        Tax Type
                      </th>

                      <th
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        Amount
                      </th>

                      <th
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        Rate
                      </th>

                      <th
                        className="
                          border
                          border-black
                          px-2
                          py-2
                        "
                      >
                        Tax Amount
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {taxSummary.length === 0 ? (

                      <tr>

                        <td
                          colSpan="4"
                          className="
                            border
                            border-black
                            px-2
                            py-4
                            text-center
                            text-gray-500
                          "
                        >
                          No tax calculated.
                        </td>

                      </tr>

                    ) : (

                      taxSummary.map(
                        (tax, index) => (

                          <tr key={index}>

                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {tax.type}
                            </td>

                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              ₹
                              {tax.taxable.toFixed(
                                2
                              )}
                            </td>

                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              {tax.rate}%
                            </td>

                            <td
                              className="
                                border
                                border-black
                                px-2
                                py-2
                                text-center
                              "
                            >
                              ₹
                              {tax.tax.toFixed(
                                2
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>


              {/* AMOUNTS */}

              <div>

                <div
                  className="
                    bg-gray-100
                    border-b
                    border-black
                    text-center
                    px-4
                    py-2
                    font-bold
                  "
                >
                  Amounts
                </div>


                <table
                  className="
                    w-full
                    border-collapse
                    text-sm
                  "
                >

                  <tbody>

                    <tr>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          font-bold
                        "
                      >
                        Sub Total
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                        "
                      >
                        ₹
                        {subtotal.toFixed(2)}
                      </td>

                    </tr>


                    <tr>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          font-bold
                        "
                      >
                        Total
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                          font-bold
                        "
                      >
                        ₹
                        {total.toFixed(2)}
                      </td>

                    </tr>


                    <tr>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          font-bold
                        "
                      >
                        Received
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                        "
                      >
                        ₹
                        {received.toFixed(2)}
                      </td>

                    </tr>


                    <tr>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          font-bold
                        "
                      >
                        Balance
                      </td>

                      <td
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                          font-bold
                        "
                      >
                        ₹
                        {balance.toFixed(2)}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>


            {/* ==================================================
                AMOUNT IN WORDS
            ================================================== */}

            <div
              className="
                bg-white
                border
                border-black
                px-4
                py-3
                mb-6
              "
            >

              <div className="font-bold">
                Invoice Amount In Words
              </div>

              <div className="mt-1">
                {
                  numberToWordsIndian(
                    total
                  )
                }
              </div>

            </div>


            {/* ==================================================
                BOTTOM SECTIONS
            ================================================== */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                bg-white
                border
                border-black
                mb-6
              "
            >

              {/* BANK DETAILS */}

              <div
                className="
                  border-r
                  border-black
                  pr-4
                "
              >

                <div
                  className="
                    relative
                    left-3
                    top-3
                  "
                >

                  <h3
                    className="
                      font-bold
                      mb-5
                    "
                  >
                    Bank Details :
                  </h3>


                  <div
                    className="
                      text-sm
                      font-bold
                      text-black
                    "
                  >

                    <p>
                      <span
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        Bank Name:
                      </span>{" "}
                      Canara Bank
                    </p>

                    <p>
                      <span
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        Account Name:
                      </span>{" "}
                      Shiv Shakti Solar Energy
                    </p>

                    <p>
                      <span
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        Account No.:
                      </span>{" "}
                      120040318797
                    </p>

                    <p>
                      <span
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        IFSC:
                      </span>{" "}
                      CNRB0017736
                    </p>

                    <p>
                      <span
                        className="
                          font-bold
                          text-gray-800
                        "
                      >
                        Branch:
                      </span>{" "}
                      NOWGONG
                    </p>

                  </div>

                </div>

              </div>


              {/* TERMS */}

              <div
                className="
                  border-b
                  md:border-b-0
                  md:border-r
                  border-black
                  p-4
                  min-h-[180px]
                "
              >

                <h3
                  className="
                    font-bold
                    mb-3
                  "
                >
                  Terms And Condition :
                </h3>


                <p
                  className="
                    text-xs
                    font-semibold
                    text-black
                    mt-2
                    leading-4
                  "
                >
                  System Ownership: Customer owns
                  the solar panels and inverter after
                  full payment, Grid Connection:
                  Customer must obtain necessary
                  approvals from local electricity
                  board, Net Metering: Excess energy
                  exported to grid credited as per
                  utility police, Tariff Charges:
                  Customer acknowledges that
                  government tariff policies may
                  change, Product Warranty: As per
                  company norms, Firm/Owner should
                  not be liable for any type of
                  damage, Exclusion: Damage due to
                  misuse, natural disaster or
                  unauthorized modifications not
                  covered.
                  "All solar installations, services
                  and jurisdictional matters will be
                  governed within the area of
                  Chhatarpur [M.P.] only."
                </p>

              </div>


              {/* SIGNATURE */}

              <div
                className="
                  p-4
                  min-h-[180px]
                  text-center
                "
              >

                <h3 className="font-bold">
                  For Shiv Shakti Solar Energy
                </h3>


                <div
                  className="
                    h-44
                    flex
                    items-center
                    justify-center
                  "
                >
                </div>


                <div className="font-bold">
                  Authorized Signatory
                </div>

              </div>

            </div>


            {/* ==================================================
                FORM BUTTONS
            ================================================== */}

            <div
              className="
                flex
                justify-end
                gap-3
              "
            >

              <button
                type="button"
                onClick={closeForm}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  font-semibold
                "
              >
                Cancel
              </button>


              {!viewMode && (

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="
                    px-6
                    py-2.5
                    rounded-lg
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >

                  {loading
                    ? "Saving..."
                    : editId
                      ? "Update Invoice"
                      : "Save Invoice"}

                </button>

              )}

            </div>

          </>

        )}

      </div>
    </>
  );
}


/* ================================================================
   NUMBER TO WORDS
================================================================ */

function numberToWordsIndian(num) {
  if (Number(num) === 0) {
    return "Zero Rupees Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convert(n) {
    if (n < 20) {
      return ones[n];
    }

    if (n < 100) {
      return (
        tens[Math.floor(n / 10)] +
        (n % 10
          ? " " + ones[n % 10]
          : "")
      );
    }

    if (n < 1000) {
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100
          ? " " + convert(n % 100)
          : "")
      );
    }

    if (n < 100000) {
      return (
        convert(
          Math.floor(n / 1000)
        ) +
        " Thousand" +
        (n % 1000
          ? " " +
            convert(n % 1000)
          : "")
      );
    }

    if (n < 10000000) {
      return (
        convert(
          Math.floor(n / 100000)
        ) +
        " Lakh" +
        (n % 100000
          ? " " +
            convert(n % 100000)
          : "")
      );
    }

    return (
      convert(
        Math.floor(n / 10000000)
      ) +
      " Crore" +
      (n % 10000000
        ? " " +
          convert(
            n % 10000000
          )
        : "")
    );
  }

  return (
    convert(
      Math.floor(
        Number(num)
      )
    ) +
    " Rupees Only"
  );
}


/* ================================================================
   CUSTOMER FULL ADDRESS
================================================================ */

function getCustomerFullAddress(customer) {
  if (!customer) {
    return "";
  }

  const clean = (value) => {
    return String(
      value ?? ""
    )
      .replace(
        /\r\n/g,
        " "
      )
      .replace(
        /\n/g,
        " "
      )
      .replace(
        /\r/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  };

  const line1 = clean(
    customer.address ||
      customer.address_line1 ||
      customer.address_line2 ||
      customer.area ||
      customer.locality
  );

  const line2Parts = [];

  if (customer.city) {
    line2Parts.push(
      clean(customer.city)
    );
  }

  if (customer.district) {
    line2Parts.push(
      `District : ${clean(
        customer.district
      )}`
    );
  }

  const line2 =
    line2Parts.join(", ");

  const line3Parts = [];

  if (customer.state) {
    line3Parts.push(
      clean(customer.state)
    );
  }

  if (
    customer.pincode ||
    customer.zipcode
  ) {
    line3Parts.push(
      clean(
        customer.pincode ||
          customer.zipcode
      )
    );
  }

  const line3 =
    line3Parts.join(", ");

  return [
    line1,
    line2,
    line3,
  ]
    .filter(
      (line) =>
        line.trim() !== ""
    )
    .join("\n");
}


/* ================================================================
   FORMAT INVOICE DATE
================================================================ */

function formatInvoiceDate(date) {
  if (!date) return "-";

  const [year, month, day] =
    String(date)
      .split("T")[0]
      .split("-");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${day}-${months[Number(month) - 1]}-${year}`;
}