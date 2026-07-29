import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";



export function exportFinanceExcel(data){


  const sheetData = [


    {
      Title:"Finance Ledger Report"
    },


    {},


    {
      "Total Value":data.totalValue,
      "Total Received":data.totalReceived,
      "Remaining":data.remaining,
      "Opening Balance":data.openingBalance,
      "Credit":data.credit,
      "Debit":data.debit,
      "Closing Balance":data.closingBalance
    }


  ];




  const worksheet = XLSX.utils.json_to_sheet(sheetData);


  const workbook = XLSX.utils.book_new();


  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Finance Ledger"
  );



  XLSX.writeFile(
    workbook,
    "Finance_Ledger.xlsx"
  );


}








export function exportFinancePDF(data){



 const doc = new jsPDF();



 doc.text(
  "Finance Ledger Report",
  14,
  15
 );





 autoTable(doc,{

 startY:25,

 head:[

 [
 "Particular",
 "Amount"
 ]

 ],

 body:[


 [
 "Total Value",
 `₹ ${data.totalValue}`
 ],


 [
 "Total Received",
 `₹ ${data.totalReceived}`
 ],



 [
 "Remaining",
 `₹ ${data.remaining}`
 ],



 [
 "Opening Balance",
 `₹ ${data.openingBalance}`
 ],



 [
 "Credit",
 `₹ ${data.credit}`
 ],



 [
 "Debit",
 `₹ ${data.debit}`
 ],



 [
 "Closing Balance",
 `₹ ${data.closingBalance}`
 ]


 ]


 });





 doc.save(
  "Finance_Ledger.pdf"
 );



}