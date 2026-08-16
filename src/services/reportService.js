import { supabase } from "./supabase";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function getCustomerReport() {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      customer_name,
      mobile,
      email,
      address,
      location,
      plant_size,
      payment_type
    `)
    .order("customer_name", { ascending: true });

  if (error) throw error;

  return data || [];
}


export async function getProjectReport() {

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_no,
      project_date,
      project_size,
      status,
      total_amount,
      received,
      customers (
        customer_name
      )
    `)
    .order("id", { ascending: true });


  if (error) throw error;


  return (data || []).map(project => ({
    ...project,

    remaining:
      Number(project.total_amount || 0) -
      Number(project.received || 0)

  }));

}

export function exportProjectReport(projects, payments) {
  const doc = new jsPDF({
  orientation: "landscape",
  unit: "mm",
  format: "a4",
});

  doc.text("PROJECT REPORT", 10, 10);

  let y = 20;

  projects.forEach((p) => {
    const received = payments
      .filter((pay) => pay.project_id === p.id)
      .reduce((sum, pay) => sum + Number(pay.amount || 0), 0);

    doc.text(
      `${p.project_name} | Total: ₹${p.total_amount} | Received: ₹${received}`,
      10,
      y
    );

    y += 10;
  });

  doc.save("report.pdf");
}

export async function exportCustomerCSV(customers) {

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Customer Report"
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
        argb: "0F766E",
      },
    };


    cell.alignment = center;
    cell.border = thinBorder;

  }


  function styleCell(cell) {

    cell.alignment = center;
    cell.border = thinBorder;

  }



  // Company Header

  sheet.mergeCells("A1:H1");

  const company = sheet.getCell("A1");

  company.value =
    "SHIV SHAKTI SOLAR ENERGY";


  company.font = {
    size:18,
    bold:true,
    color:{
      argb:"FFFFFF",
    },
  };


  company.alignment = center;


  company.fill = {
    type:"pattern",
    pattern:"solid",
    fgColor:{
      argb:"1E3A8A",
    },
  };


  sheet.getRow(1).height = 28;



  // Report Title

  sheet.mergeCells("A2:H2");


  const title = sheet.getCell("A2");


  title.value =
    "Customer Report";


  title.font = {
    size:14,
    bold:true,
  };


  title.alignment=center;



  // Summary

  sheet.addRow([]);


  sheet.addRow([
    "Total Customers",
    "Cash Customers",
    "Finance Customers",
  ]);


  sheet.addRow([

    customers.length,

    customers.filter(
      c=>c.payment_type==="Cash"
    ).length,


    customers.filter(
      c=>c.payment_type==="Finance"
    ).length,

  ]);



  sheet.getRow(4).eachCell(cell=>{
    styleHeader(cell);
  });


  sheet.getRow(5).eachCell(cell=>{
    styleCell(cell);
  });



  sheet.addRow([]);
  sheet.addRow([]);



  // Table Header

  const headerRow = sheet.addRow([

    "S.No",

    "Customer Name",

    "Mobile",

    "Email",

    "Address",

    "Location",

    "Plant Size",

    "Payment Type",

  ]);



  headerRow.eachCell(cell=>{
    styleHeader(cell);
  });



  // Data

  customers.forEach((customer,index)=>{


    const row = sheet.addRow([

      index+1,

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



  // Auto Width

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


    column.width=max;

  });



  // Freeze

  sheet.views=[
    {
      state:"frozen",
      ySplit:7,
    }
  ];



  const buffer =
    await workbook.xlsx.writeBuffer();


  saveAs(
    new Blob([buffer]),
    "Customer Report.xlsx"
  );

}

