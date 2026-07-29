import { supabase } from "./supabase";

/* ============================
   GET NEXT/LAST INVOICE NUMBER
============================ */

export async function getLastInvoiceNumber() {

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return "INV-001";
  }

  const lastNumber = data[0].invoice_number || "";

  const match = lastNumber.match(/^INV-(\d+)$/);

  if (!match) {
    return "INV-001";
  }

  const next = Number(match[1]) + 1;

  return `INV-${String(next).padStart(3, "0")}`;
}

/* ============================
   GET CUSTOMERS
============================ */

export async function getInvoiceCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("id, customer_name, address")
    .order("customer_name");

  if (error) throw error;

  return data;
}

/* ============================
   SAVE INVOICE
============================ */

export async function saveInvoice(invoice) {

const payload = {

...invoice,

table_total: invoice.total

};


const { error } = await supabase
.from("invoices")
.insert([payload]);


if(error) throw error;

}

/* ============================
   GET INVOICE BY ID
============================ */

export async function getInvoiceById(id) {

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;

}


/* ============================
   UPDATE INVOICE
============================ */

export async function updateInvoice(id, invoice) {


const payload = {

...invoice,

table_total: invoice.total

};



const { error } = await supabase
.from("invoices")
.update(payload)
.eq("id",id);



if(error) throw error;


}

/* ============================
   GET INVOICES
============================ */

export async function getInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("invoice_date", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}

/* ============================
   DELETE INVOICE
============================ */

export async function deleteInvoice(id) {
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) throw error;
}