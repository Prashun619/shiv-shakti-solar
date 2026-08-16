import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const HEADER_FILL = "0F766E";
const TITLE_FILL = "1E3A8A";

const thinBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const center = {
  horizontal: "center",
  vertical: "middle",
};

function styleHeader(cell, color = HEADER_FILL) {
  cell.font = {
    bold: true,
    color: { argb: "FFFFFF" },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color },
  };

  cell.alignment = center;
  cell.border = thinBorder;
}

function styleCell(cell) {
  cell.alignment = center;
  cell.border = thinBorder;
}

export async function exportProjectExcel(projects) {

  projects = [...projects].sort(
  (a, b) =>
    Number(a.project_no.replace(/\D/g, "")) -
    Number(b.project_no.replace(/\D/g, ""))
);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Project Report");

  // =====================================
  // Company Title
  // =====================================

  sheet.mergeCells("A1:H1");

  const company = sheet.getCell("A1");

  company.value = "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: { argb: "FFFFFF" },
  };

  company.alignment = center;

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: TITLE_FILL },
  };

  sheet.getRow(1).height = 28;

  // =====================================
  // Report Title
  // =====================================

 sheet.mergeCells("A2:H2");

  const title = sheet.getCell("A2");

  title.value = "Project Report";

  title.font = {
    size: 14,
    bold: true,
  };

  title.alignment = center;

  // =====================================
  // Summary
  // =====================================

  const totalProjects = projects.length;

  const totalValue = projects.reduce(
    (sum, p) => sum + Number(p.total_amount || 0),
    0
  );

  const totalReceived = projects.reduce(
    (sum, p) => sum + Number(p.received || 0),
    0
  );

  const totalBalance = projects.reduce(
    (sum, p) => sum + Number(p.remaining || 0),
    0
  );

  sheet.addRow([]);

  sheet.addRow([
    "Total Projects",
    "Project Value",
    "Received Amount",
    "Balance Amount",
  ]);

  sheet.addRow([
    totalProjects,
    totalValue,
    totalReceived,
    totalBalance,
  ]);

  const summaryHeader = sheet.getRow(4);

  summaryHeader.eachCell((cell) => {
    styleHeader(cell);
  });

  const summaryData = sheet.getRow(5);

  summaryData.eachCell((cell, col) => {
    styleCell(cell);

    if (col > 1) {
      cell.numFmt = '#,##0.00';
    }
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // =====================================
  // Main Table Header
  // =====================================

  const projectHeaderRow = sheet.addRow([
  "S.No",
  "Project No",
  "Customer",
  "Plant Size",
  "Status",
  "Total Amount",
  "Received",
  "Balance",
]);

  projectHeaderRow.eachCell((cell) => {
    styleHeader(cell);
  });

  // =====================================
  // Table Data
  // =====================================

 projects.forEach((project, index) => {

  const balance =
    Number(project.total_amount || 0) -
    Number(project.received || 0);


  const row = sheet.addRow([
    index + 1,
    project.project_no || "",
    project.customers?.customer_name || "",
    project.project_size || "",
    project.status || "",
    Number(project.total_amount || 0),
    Number(project.received || 0),
    balance,
  ]);

    row.eachCell((cell, col) => {
      styleCell(cell);

      if (col >= 7) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // =====================================
  // Auto Column Width
  // =====================================

  sheet.columns.forEach((column) => {
    let max = 15;

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = String(cell.value ?? "").length + 4;

      if (length > max) max = length;
    });

    column.width = max;
  });

  // =====================================
  // Freeze Header
  // =====================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: 7,
    },
  ];

  // =====================================
  // Download
  // =====================================

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "Project Report.xlsx"
  );
}

export async function exportCustomerExcel(customers) {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Customer Report");


  // ===============================
  // Company Title
  // ===============================

  sheet.mergeCells("A1:H1");

  const company = sheet.getCell("A1");

  company.value = "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: { argb: "FFFFFF" },
  };

  company.alignment = center;

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: TITLE_FILL },
  };


  sheet.getRow(1).height = 28;



  // ===============================
  // Report Title
  // ===============================

  sheet.mergeCells("A2:H2");

  const title = sheet.getCell("A2");

  title.value = "Customer Report";

  title.font = {
    size: 14,
    bold: true,
  };

  title.alignment = center;



  // ===============================
  // Summary
  // ===============================

  const totalCustomers = customers.length;

  const cashCustomers = customers.filter(
    c => c.payment_type === "Cash"
  ).length;


  const financeCustomers = customers.filter(
    c => c.payment_type === "Finance"
  ).length;



  sheet.addRow([]);

  sheet.addRow([
    "Total Customers",
    "Cash Customers",
    "Finance Customers",
  ]);


  sheet.addRow([
    totalCustomers,
    cashCustomers,
    financeCustomers,
  ]);



  sheet.getRow(4).eachCell(cell => {
    styleHeader(cell);
  });


  sheet.getRow(5).eachCell(cell => {
    styleCell(cell);
  });



  sheet.addRow([]);
  sheet.addRow([]);



  // ===============================
  // Table Header
  // ===============================

  const customerHeaderRow = sheet.addRow([
  "S.No",
"Project No",
"Customer",
"Plant Size",
"Status",
"Total Amount",
"Received",
"Balance",
]);


  customerHeaderRow.eachCell(cell => {
    styleHeader(cell);
  });



  // ===============================
  // Customer Data
  // ===============================

  customers.forEach((customer,index)=>{


    const row = sheet.addRow([

      index + 1,

      customer.customer_name || "",

      customer.mobile || "",

      customer.email || "",

      customer.address || "",

      customer.location || "",

      customer.plant_size || "",

      customer.payment_type || "",

    ]);



    row.eachCell(cell=>{

      styleCell(cell);

    });


  });



  // ===============================
  // Column Width
  // ===============================

  sheet.columns.forEach(column=>{

    let max = 15;


    column.eachCell(
      {includeEmpty:true},
      cell=>{

        const length =
          String(cell.value ?? "").length + 4;


        if(length > max)
          max = length;

      }
    );


    column.width = max;

  });



  // ===============================
  // Freeze Header
  // ===============================

  sheet.views = [
    {
      state:"frozen",
      ySplit:7,
    },
  ];



  // ===============================
  // Download
  // ===============================

  const buffer =
    await workbook.xlsx.writeBuffer();


  saveAs(
    new Blob([buffer]),
    "Customer Report.xlsx"
  );

}