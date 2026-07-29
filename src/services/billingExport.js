import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";





export function exportBillingExcel(data){



  const rows = data.map(item=>({


    "Date":item.date,


    "Company":item.company,


    "Paid By":item.paid_by,


    "Payment Type":item.payment_type,


    "Payment Mode":item.payment_mode,


    "Amount":item.amount,


    "Remarks":item.remarks


  }));





  const worksheet =
    XLSX.utils.json_to_sheet(rows);



  const workbook =
    XLSX.utils.book_new();




  XLSX.utils.book_append_sheet(

    workbook,

    worksheet,

    "Billing"

  );





  XLSX.writeFile(

    workbook,

    "Billing_Report.xlsx"

  );



}









export function exportBillingPDF(data){



 const doc = new jsPDF();




 doc.text(

  "Billing Report",

  14,

  15

 );







 autoTable(doc,{


 startY:25,



 head:[


 [

 "Date",

 "Company",

 "Paid By",

 "Type",

 "Mode",

 "Amount"

 ]


 ],





 body:data.map(item=>[



 item.date,


 item.company,


 item.paid_by,


 item.payment_type,


 item.payment_mode,


 `₹ ${item.amount}`



 ])




 });







 doc.save(

  "Billing_Report.pdf"

 );



}