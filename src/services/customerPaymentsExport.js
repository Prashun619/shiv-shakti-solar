import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";



export function exportCustomerPaymentsExcel(data){


  const rows = data.map(item => ({

    "Project No": item.project_no,

    "Customer Name":
      item.customers?.customer_name || "-",

    "Plant Size":
      item.project_size,

    "Project Amount":
      item.total_amount,

    "Received":
      item.received,

    "Remaining":
      item.remaining

  }));



  const worksheet =
    XLSX.utils.json_to_sheet(rows);



  const workbook =
    XLSX.utils.book_new();



  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Customer Payments"
  );



  XLSX.writeFile(
    workbook,
    "Customer_Payments.xlsx"
  );


}









export function exportCustomerPaymentsPDF(data){


 const doc = new jsPDF();



 doc.text(
  "Customer Payments Report",
  14,
  15
 );





 autoTable(doc,{

 startY:25,


 head:[

 [
 "Project No",
 "Customer",
 "Plant Size",
 "Amount",
 "Received",
 "Remaining"
 ]

 ],



 body:data.map(item=>[

 item.project_no,

 item.customers?.customer_name || "-",

 item.project_size,

 `₹ ${item.total_amount}`,

 `₹ ${item.received}`,

 `₹ ${item.remaining}`

 ])


 });





 doc.save(
  "Customer_Payments.pdf"
 );


}