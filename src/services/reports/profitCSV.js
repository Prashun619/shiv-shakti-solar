import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportProfitCSV(profitData) {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Profit Report"
  );

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

  function styleHeader(cell) {

    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFF",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
  argb: "15803D",
},
    };

    cell.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};
    cell.border = thinBorder;

  }

  function styleCell(cell) {

    cell.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};
    cell.border = thinBorder;

  }

  // ======================================
  // Company Header
  // ======================================

  sheet.mergeCells("A1:J1");

  const company = sheet.getCell("A1");

  company.value = "SHIV SHAKTI SOLAR ENERGY";

  company.font = {
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFF",
    },
  };

  company.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "1E3A8A",
    },
  };

  company.alignment = center;

  sheet.getRow(1).height = 28;

  // ======================================
  // Report Title
  // ======================================

  sheet.mergeCells("A2:J2");

  const title = sheet.getCell("A2");

  title.value = "Profit Report";

  title.font = {
    size: 14,
    bold: true,
  };

  title.alignment = center;

  // ======================================
  // Summary
  // ======================================

  const totalSelling = profitData.reduce(
    (sum, item) => sum + Number(item.selling_amount || 0),
    0
  );

  const totalMaterial = profitData.reduce(
    (sum, item) => sum + Number(item.material_cost || 0),
    0
  );

  const totalOther = profitData.reduce(
    (sum, item) => sum + Number(item.other_cost || 0),
    0
  );

  const totalCost = profitData.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const totalProfit = profitData.reduce(
    (sum, item) => sum + Number(item.profit_amount || 0),
    0
  );

  const profitPercent =
    totalSelling > 0
      ? ((totalProfit / totalSelling) * 100).toFixed(2)
      : "0.00";

  sheet.addRow([]);

  sheet.addRow([
    "Overall Selling",
    "Overall Cost",
    "Overall Profit",
    "Profit %",
  ]);

  sheet.addRow([
    totalSelling,
    totalCost,
    totalProfit,
    Number(profitPercent),
  ]);

  sheet.getRow(4).eachCell(styleHeader);

  sheet.getRow(5).eachCell(styleCell);

  sheet.getRow(5).getCell(1).numFmt='₹#,##0.00';
sheet.getRow(5).getCell(2).numFmt='₹#,##0.00';
sheet.getRow(5).getCell(3).numFmt='₹#,##0.00';
  sheet.getRow(5).getCell(4).numFmt = '0.00';

  sheet.addRow([]);
  sheet.addRow([]);

  // ======================================
  // Table Header
  // ======================================

  const header = sheet.addRow([
    "S.No",
    "Project No",
    "Customer",
    "Plant Size",
    "Selling Amount",
    "Material Cost",
    "Other Cost",
    "Total Cost",
    "Profit Amount",
    "Profit %",
  ]);

  header.eachCell(styleHeader);

  // ======================================
  // Data
  // ======================================

  profitData.forEach((item, index) => {

    const row = sheet.addRow([
      index + 1,
      item.project_no,
      item.customer_name,
      item.project_size,
      Number(item.selling_amount || 0),
      Number(item.material_cost || 0),
      Number(item.other_cost || 0),
      Number(item.total_cost || 0),
      Number(item.profit_amount || 0),
      Number(item.profit_percent || 0),
    ]);

    row.eachCell(styleCell);

    for (let i = 5; i <= 9; i++) {
      row.getCell(i).numFmt = '₹#,##0.00';
    }

    row.getCell(10).numFmt = '0.00';

  });


// ======================================
// Auto Width
// ======================================

sheet.columns.forEach((column) => {

  let maxLength = 12;

  column.eachCell(
    { includeEmpty: true },
    (cell) => {

      const value =
        cell.value == null
          ? ""
          : cell.value.toString();

      maxLength = Math.max(
        maxLength,
        value.length + 4
      );

    }
  );

  column.width = Math.min(maxLength, 35);

});

// ======================================
// Auto Row Height
// ======================================

sheet.eachRow((row) => {

  row.height = 24;

});

  // ======================================
  // Freeze Header
  // ======================================

  sheet.views = [
    {
      state: "frozen",
      ySplit: 7,
    },
  ];

  // ======================================
  // Download
  // ======================================

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "Profit Report.xlsx"
  );

}