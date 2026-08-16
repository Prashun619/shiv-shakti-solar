import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getUsedInventory } from "../usedInventoryService";

export async function exportInventoryCSV(
  inventory,
  usedInventory
) {




  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet(
    "Inventory Report"
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
        argb:"7C3AED",
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


  sheet.mergeCells("A2:H2");


  const title = sheet.getCell("A2");


  title.value =
    "Inventory Report";


  title.font = {

    size:14,

    bold:true,

  };


  title.alignment=center;





  // ===============================
  // Summary
  // ===============================

const totalProducts = inventory.length;
  


  const stockValue = inventory.reduce(

    (sum,item)=>

      sum +
      (
        Number(item.quantity || 0) *
        Number(item.unit_cost || 0)
      ),

    0

  );




  sheet.addRow([]);


  sheet.addRow([

  "Total Products",

  "Stock Value",

]);


sheet.addRow([

  totalProducts,

  stockValue,

]);




  sheet.getRow(4).eachCell(cell=>{

    styleHeader(cell);

  });



  sheet.getRow(5).eachCell(cell=>{

    styleCell(cell);

  });



  sheet.getRow(5)
  .getCell(2)
  .numFmt='#,##0.00';




  sheet.addRow([]);

  sheet.addRow([]);





  // ===============================
  // Table Header
  // ===============================


 const headerRow = sheet.addRow([

  "S.No",
  "Product",
  "Category",
  "Quantity",
  "Unit",
  "Price",
  "CGST %",
  "SGST %",
  "Total GST",
  "Transportation",
  "Total",
  "Unit Price",

]);



  headerRow.eachCell(cell=>{

    styleHeader(cell);

  });







  // ===============================
  // Data
  // ===============================


  inventory.forEach((item,index)=>{


    const productName = [

      item.company,

      item.product_name,

      item.specification,

    ]
    .filter(Boolean)
    .join(" ");



   const gst =
(
 Number(item.price || 0) *
 (
  Number(item.cgst || 0) +
  Number(item.sgst || 0)
 )
) / 100;


const total =
(
 Number(item.price || 0) *
 Number(item.quantity || 0)
)
+
gst
+
Number(item.transportation || 0);



const row = sheet.addRow([

 index + 1,

 productName,

 item.category || "",

 Number(item.quantity || 0),

 item.unit || "",

 Number(item.price || 0),

 Number(item.cgst || 0),

 Number(item.sgst || 0),

 Number(gst),

 Number(item.transportation || 0),

 Number(total),

 Number(item.unit_cost || 0),

]);



    row.eachCell(cell=>{

      styleCell(cell);

    });



    row.getCell(7).numFmt =
  '#,##0.00';


row.getCell(8).numFmt =
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


// =====================================
// CUSTOMER WISE MATERIAL CONSUMPTION
// =====================================


const customerMap = {};


usedInventory.forEach((item)=>{

  const customerName =
    item.customers?.customer_name ||
    "Unknown Customer";


  if(!customerMap[customerName]){

    customerMap[customerName] = [];

  }


  (item.products || []).forEach(product=>{

    customerMap[customerName].push({

      product_name:
        product.product_name || "",

      category:
        product.category || "",

      quantity:
        product.quantity || 0,

      unit:
        product.unit || "",

    });

  });

});






// =====================================
// CUSTOMER WISE MATERIAL CONSUMPTION
// =====================================

if (usedInventory && usedInventory.length > 0) {

  const customerData = {};


  usedInventory.forEach((item)=>{


    const customerName =
      item.customers?.customer_name ||
      item.customer_name;


    if(!customerName) return;



    if(!customerData[customerName]) {

      customerData[customerName] = [];

    }



    if(Array.isArray(item.products)) {


      item.products.forEach(product=>{


        customerData[customerName].push({

          product:
          [
            product.company,
            product.product_name,
            product.specification

          ]
          .filter(Boolean)
          .join(" "),


          category:
          product.category || "",


          quantity:
          Number(product.quantity || 0),


          unit:
          product.unit || "",

        });


      });

    }


  });



  Object.entries(customerData)
  .forEach(([customerName, products])=>{


    const sheetName =
      customerName
      .substring(0,31)
      .replace(/[\\\/\?\*\[\]]/g,"");


    let finalSheetName = sheetName;

let counter = 1;

while(workbook.getWorksheet(finalSheetName)){

  finalSheetName =
    `${sheetName.substring(0,25)}_${counter}`;

  counter++;

}


const customerSheet =
      workbook.addWorksheet(finalSheetName);



    customerSheet.mergeCells("A1:E1");


    const title =
      customerSheet.getCell("A1");


    title.value =
      customerName;


    title.font={
      size:18,
      bold:true,
      color:{
        argb:"FFFFFF"
      }
    };


    title.fill={
      type:"pattern",
      pattern:"solid",
      fgColor:{
        argb:"1E3A8A"
      }
    };


    title.alignment=center;



    const header =
    customerSheet.addRow([

      "S.No",
      "Product",
      "Category",
      "Quantity",
      "Unit"

    ]);



    header.eachCell(cell=>{
      styleHeader(cell);
    });



    products.forEach((p,index)=>{


      const row =
      customerSheet.addRow([

        index+1,

        p.product,

        p.category,

        p.quantity,

        p.unit

      ]);



      row.eachCell(cell=>{
        styleCell(cell);
      });


    });



    customerSheet.columns.forEach(column=>{

      let max=15;


      column.eachCell(
        {includeEmpty:true},
        cell=>{

          const len =
          String(cell.value ?? "").length + 4;


          if(len>max)
            max=len;

        }
      );


      column.width=max;


    });


  });


}



  // ===============================
  // Download
  // ===============================


  const buffer =
    await workbook.xlsx.writeBuffer();



  saveAs(

    new Blob([buffer]),

    "Inventory Report.xlsx"

  );


}