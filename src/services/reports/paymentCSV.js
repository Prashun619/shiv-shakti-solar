import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


export async function exportPaymentCSV(payments) {


  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Payment Report"
  );


  const thinBorder = {

    top: { style:"thin" },
    left: { style:"thin" },
    bottom: { style:"thin" },
    right: { style:"thin" },

  };


  const center = {

    horizontal:"center",
    vertical:"middle",

  };



  function styleHeader(cell){

    cell.font = {

      bold:true,

      color:{
        argb:"FFFFFF",
      },

    };


    cell.fill = {

      type:"pattern",

      pattern:"solid",

      fgColor:{
        argb:"D97706",
      },

    };


    cell.alignment=center;

    cell.border=thinBorder;

  }



  function styleCell(cell){

    cell.alignment=center;

    cell.border=thinBorder;

  }



  // ===============================
  // Company Header
  // ===============================


  sheet.mergeCells("A1:I1");


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


  company.alignment=center;


  company.fill = {

    type:"pattern",

    pattern:"solid",

    fgColor:{
      argb:"1E3A8A",
    },

  };


  sheet.getRow(1).height=28;



  // ===============================
  // Report Title
  // ===============================


  sheet.mergeCells("A2:I2");


  const title = sheet.getCell("A2");


  title.value =
    "Payment Report";


  title.font = {

    size:14,

    bold:true,

  };


  title.alignment=center;



  // ===============================
  // Summary
  // ===============================


  const totalPayments = payments.length;


  const totalAmount = payments.reduce(
    (sum,p)=>
      sum + Number(p.amount || 0),
    0
  );



  sheet.addRow([]);


  sheet.addRow([

    "Total Payments",

    "Total Amount",

  ]);



  sheet.addRow([

    totalPayments,

    totalAmount,

  ]);



  sheet.getRow(4).eachCell(cell=>{

    styleHeader(cell);

  });



  sheet.getRow(5).eachCell(cell=>{

    styleCell(cell);


  });



  sheet.getRow(5).getCell(2).numFmt =
    '#,##0.00';



  sheet.addRow([]);

  sheet.addRow([]);




  // ===============================
  // Table Header
  // ===============================


  const headerRow = sheet.addRow([
  "S.No",
  "Date",
  "Customer",
  "Project No",
  "Payment Type",
  "Payment Mode",
  "Amount",
  "Reference No",
  "Remarks",
]);



  headerRow.eachCell(cell=>{

    styleHeader(cell);

  });





  // ===============================
  // Data
  // ===============================


  payments.forEach((payment,index)=>{


   const row = sheet.addRow([

  index + 1,

  payment.payment_date
    ? new Date(payment.payment_date)
        .toLocaleDateString(
          "en-GB",
          {
            day:"2-digit",
            month:"short",
            year:"numeric",
          }
        )
    : "",


  payment.projects?.customers?.customer_name || "",


  payment.projects?.project_no || "",


  payment.payment_type || "",


  payment.payment_mode || "",


  Number(payment.amount || 0),


  payment.reference_no || "",


  payment.remarks || "",

]);

console.log(
  "CUSTOMER NAME:",
  payment.projects?.customers?.customer_name
);

console.log(
  "PROJECT DATA:",
  payment.projects
);

    row.eachCell(cell=>{

      styleCell(cell);

    });



    row.getCell(7).numFmt =
      '#,##0.00';



  });




  // ===============================
  // Auto Width
  // ===============================


  sheet.columns.forEach(column=>{


    let max=15;


    column.eachCell(
      {includeEmpty:true},
      cell=>{


        const length =
          String(cell.value ?? "").length + 4;


        if(length > max)
          max=length;


      }
    );


    column.width=max;


  });




  // ===============================
  // Freeze Header
  // ===============================


  sheet.views=[

    {

      state:"frozen",

      ySplit:7,

    }

  ];





  // ===============================
  // Download
  // ===============================


  const buffer =
    await workbook.xlsx.writeBuffer();



  saveAs(

    new Blob([buffer]),

    "Payment Report.xlsx"

  );


}