import { supabase } from "./supabase";
// =====================================================
// PARTNERS
// =====================================================

export async function getPartners() {
  const { data, error } = await supabase
    .from("partners")
    .select("id, partner_name")
    .eq("is_active", true)
    .order("partner_name", { ascending: true });

  if (error) {
    console.error("Error fetching partners:", error);
    throw error;
  }

  return data || [];
}

// =====================================================
// INVESTMENTS
// =====================================================

export async function getInvestments() {
  const { data, error } = await supabase
    .from("investments")
    .select(`
      *,
      partners (
        id,
        partner_name
      )
    `)
    .order("investment_date", { ascending: false });

  if (error) {
    console.error("Error fetching investments:", error);
    throw error;
  }

  return data || [];
}

// =====================================================
// ADD INVESTMENT
// =====================================================

export async function addInvestment(investment) {
  // =====================================================
  // 1. GET INVESTOR NAME
  // =====================================================

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("partner_name")
    .eq("id", investment.partner_id)
    .single();

  if (partnerError) {
    console.error("INVESTOR FETCH ERROR:", partnerError);
    throw partnerError;
  }

  // =====================================================
  // 2. CREATE INVESTMENT
  // =====================================================

  const { data: savedInvestment, error: investmentError } =
    await supabase
      .from("investments")
      .insert([investment])
      .select()
      .single();

  if (investmentError) {
    console.error("INVESTMENT INSERT ERROR:", investmentError);
    throw investmentError;
  }

  // =====================================================
  // 3. CREATE BILLING ENTRY
  // =====================================================

  let billingEntry = {
    date: savedInvestment.investment_date,
    type: "Expense",
    company: "Investment",
    paid_by: partner.partner_name,
    payment_mode: savedInvestment.payment_mode,
    amount: Number(savedInvestment.amount),
    remarks: savedInvestment.purpose || "",
    source_type: "Investment",
    source_id: savedInvestment.id,
  };

  // =====================================================
  // ADDITIONAL INVESTMENT
  // =====================================================

  if (
    savedInvestment.investment_type ===
    "Additional Investment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Income",
      company: "Investment",
      remarks: `Added by ${
  partner.partner_name.split(" ")[0]
}`,
    };
  }

  // =====================================================
  // DEALER PAYMENT
  // =====================================================

  else if (
    savedInvestment.investment_type ===
    "Dealer Payment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company:
        savedInvestment.dealer_name ||
        "Dealer Payment",
      remarks: "Dealer Payment",
    };
  }

  // =====================================================
  // VENDOR PAYMENT
  // =====================================================

  else if (
    savedInvestment.investment_type ===
    "Vendor Payment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company:
        savedInvestment.vendor_name ||
        "Vendor Payment",
      remarks: "Vendor Payment",
    };
  }

  // =====================================================
  // MISCELLANEOUS
  // =====================================================

  else if (
    savedInvestment.investment_type ===
    "Miscellaneous"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company: "Miscellaneous",
      remarks: "Miscellaneous",
    };
  }

  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "INVESTMENT BILLING ENTRY:",
    billingEntry
  );

  // =====================================================
  // 4. INSERT INTO BILLING
  // =====================================================

  const {
    data: billingData,
    error: billingError,
  } = await supabase
    .from("billing")
    .insert([billingEntry])
    .select()
    .single();

  // =====================================================
  // 5. BILLING ERROR
  // =====================================================

  if (billingError) {
    console.error(
      "FINANCE LEDGER INSERT ERROR:",
      billingError
    );

    // Try to remove the investment we just created
    const { error: rollbackError } = await supabase
      .from("investments")
      .delete()
      .eq("id", savedInvestment.id);

    if (rollbackError) {
      console.error(
        "INVESTMENT ROLLBACK ERROR:",
        rollbackError
      );
    }

    throw billingError;
  }

  // =====================================================
  // 6. SUCCESS
  // =====================================================

  console.log(
    "FINANCE LEDGER ENTRY CREATED:",
    billingData
  );

  return savedInvestment;
}

// =====================================================
// UPDATE INVESTMENT
// =====================================================

export async function updateInvestment(id, investment) {
  // =====================================================
  // 1. GET INVESTOR NAME
  // =====================================================

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("partner_name")
    .eq("id", investment.partner_id)
    .single();

  if (partnerError) {
    console.error("INVESTOR FETCH ERROR:", partnerError);
    throw partnerError;
  }

  // =====================================================
  // 2. UPDATE INVESTMENT
  // =====================================================

  const { data: updatedInvestment, error: investmentError } =
    await supabase
      .from("investments")
      .update(investment)
      .eq("id", id)
      .select()
      .single();

  if (investmentError) {
    console.error(
      "INVESTMENT UPDATE ERROR:",
      investmentError
    );
    throw investmentError;
  }

  // =====================================================
  // 3. PREPARE BILLING ENTRY
  // =====================================================

  let billingEntry = {
    date: updatedInvestment.investment_date,
    type: "Expense",
    company: "Investment",
    paid_by: partner.partner_name,
    payment_mode: updatedInvestment.payment_mode,
    amount: Number(updatedInvestment.amount),
    remarks: updatedInvestment.purpose || "",
  };

  // =====================================================
  // ADDITIONAL INVESTMENT
  // =====================================================

  if (
    updatedInvestment.investment_type ===
    "Additional Investment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Income",
      company: "Investment",
      remarks: `Added by ${
        partner.partner_name.split(" ")[0]
      }`,
    };
  }

  // =====================================================
  // DEALER PAYMENT
  // =====================================================

  else if (
    updatedInvestment.investment_type ===
    "Dealer Payment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company:
        updatedInvestment.dealer_name ||
        "Dealer Payment",
      remarks: "Dealer Payment",
    };
  }

  // =====================================================
  // VENDOR PAYMENT
  // =====================================================

  else if (
    updatedInvestment.investment_type ===
    "Vendor Payment"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company:
        updatedInvestment.vendor_name ||
        "Vendor Payment",
      remarks: "Vendor Payment",
    };
  }

  // =====================================================
  // MISCELLANEOUS
  // =====================================================

  else if (
    updatedInvestment.investment_type ===
    "Miscellaneous"
  ) {
    billingEntry = {
      ...billingEntry,
      type: "Expense",
      company: "Miscellaneous",
      remarks: "Miscellaneous",
    };
  }

  // =====================================================
  // 4. UPDATE CORRESPONDING BILLING ENTRY
  // =====================================================

  const {
    data: billingData,
    error: billingError,
  } = await supabase
    .from("billing")
    .update(billingEntry)
    .eq("source_type", "Investment")
    .eq("source_id", id)
    .select()
    .single();

  if (billingError) {
    console.error(
      "FINANCE LEDGER UPDATE ERROR:",
      billingError
    );

    throw billingError;
  }

  console.log(
    "FINANCE LEDGER ENTRY UPDATED:",
    billingData
  );

  return updatedInvestment;
}

// =====================================================
// DELETE INVESTMENT
// =====================================================

export async function deleteInvestment(id) {
  // =====================================================
  // 1. DELETE FINANCE LEDGER ENTRY FIRST
  // =====================================================

  const { error: billingError } = await supabase
    .from("billing")
    .delete()
    .eq("source_type", "Investment")
    .eq("source_id", id);

  if (billingError) {
    console.error(
      "FINANCE LEDGER DELETE ERROR:",
      billingError
    );

    throw billingError;
  }

  // =====================================================
  // 2. DELETE INVESTMENT
  // =====================================================

  const { error: investmentError } = await supabase
    .from("investments")
    .delete()
    .eq("id", id);

  if (investmentError) {
    console.error(
      "INVESTMENT DELETE ERROR:",
      investmentError
    );

    throw investmentError;
  }

  console.log(
    "INVESTMENT AND FINANCE LEDGER ENTRY DELETED:",
    id
  );
}