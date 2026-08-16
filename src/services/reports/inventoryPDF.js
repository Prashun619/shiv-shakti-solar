import {
  createReportPDF,
  drawTable,
  addFooter,
} from "./pdfTable";


export function exportInventoryPDF(inventory) {

  const doc = createReportPDF("Inventory Report");


  // ===============================
// Summary Table
// ===============================


const totalProducts = inventory.length;


const stockValue = inventory.reduce(
  (sum, item) =>
    sum +
    (
      Number(item.quantity || 0) *
      Number(item.unit_cost || 0)
    ),
  0
);



const summaryColumns = [

  {
    title: "Total Products",
    width: 45,
  },

  {
    title: "Stock Value",
    width: 45,
  },

];



const summaryRows = [

  [

    totalProducts,

    Number(stockValue)
      .toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ),

  ],

];



drawTable(
  doc,
  summaryColumns,
  summaryRows,
  55,
  8
);

  // ===============================
  // Table Columns
  // ===============================


  const columns = [

    {
      title: "S.No",
      width: 12,
    },

    {
      title: "Supplier",
      width: 30,
    },

    {
      title: "Product",
      width: 45,
    },

    {
      title: "Category",
      width: 25,
    },

    {
      title: "Available Qty",
      width: 25,
    },

    {
      title: "Unit",
      width: 15,
    },

    {
      title: "Unit Cost",
      width: 28,
    },

    {
      title: "Stock Value",
      width: 30,
    },

  ];




  // ===============================
  // Table Rows
  // ===============================


  const rows = inventory.map(
    (item, index) => {


      let productName =
        item.product_name || "";


      if (item.company) {

        productName =
          `${item.company} ${productName}`;

      }


      if (item.specification) {

        productName +=
          ` ${item.specification}`;

      }



      return [

        index + 1,

        item.supplier || "",

        productName,

        item.category || "",

        item.quantity || 0,

        item.unit || "",


        Number(item.unit_cost || 0)
          .toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          ),



        (
          Number(item.quantity || 0) *
          Number(item.unit_cost || 0)
        )
        .toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ),

      ];

    }
  );





  // ===============================
  // Draw Table
  // ===============================


  drawTable(
  doc,
  columns,
  rows,
  75
);




  // ===============================
  // Footer
  // ===============================


  addFooter(doc);



  doc.save(
    "Inventory Report.pdf"
  );

}