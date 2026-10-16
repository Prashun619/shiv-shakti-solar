import { supabase } from "./supabase";

/* =========================================================
   GET NEXT INVOICE NUMBER
   Format: INV-2026-001
========================================================= */

export async function getNextNewInvoiceNumber() {

  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("new_invoices")
    .select("invoice_number");

  if (error) throw error;

  let highestNumber = 0;

  (data || []).forEach((invoice) => {

    const invoiceNumber =
      String(invoice.invoice_number || "").trim();

    const match = invoiceNumber.match(
      new RegExp(`^INV-${currentYear}-(\\d+)$`, "i")
    );

    if (!match) return;

    const number = Number(match[1]);

    if (
      Number.isFinite(number) &&
      number > highestNumber
    ) {
      highestNumber = number;
    }

  });

  const nextNumber = highestNumber + 1;

  return `INV-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
}


/* =========================================================
   GET CUSTOMERS
========================================================= */

export async function getNewInvoiceCustomers() {

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}


/* =========================================================
   GET NEW INVOICES
   Only reads NEW invoice table
========================================================= */

export async function getNewInvoices() {

  const { data, error } = await supabase
    .from("new_invoices")
    .select("*")
    .order("invoice_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}


/* =========================================================
   SAVE NEW INVOICE
========================================================= */

export async function saveNewInvoice(invoice) {

  const payload = {
    ...invoice,
    table_total: invoice.total,
  };

  const { data, error } = await supabase
    .from("new_invoices")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return data;
}


/* =========================================================
   GET NEW INVOICE BY ID
========================================================= */

export async function getNewInvoiceById(id) {

  const { data, error } = await supabase
    .from("new_invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}


/* =========================================================
   UPDATE NEW INVOICE
========================================================= */

export async function updateNewInvoice(id, invoice) {

  const payload = {
    ...invoice,
    table_total: invoice.total,
  };

  const { data, error } = await supabase
    .from("new_invoices")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
/* =========================================================
   DELETE NEW INVOICE
========================================================= */

export async function deleteNewInvoice(id) {

  const { error } = await supabase
    .from("new_invoices")
    .delete()
    .eq("id", id);

  if (error) throw error;
}