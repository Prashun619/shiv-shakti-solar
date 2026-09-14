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

  const { data: partner, error: partnerError } =
    await supabase
      .from("partners")
      .select("partner_name")
      .eq("id", investment.partner_id)
      .single();

  if (partnerError) {
    console.error(
      "INVESTOR FETCH ERROR:",
      partnerError
    );

    throw partnerError;
  }

  // =====================================================
  // 2. CREATE INVESTMENT
  // =====================================================

  const {
    data: savedInvestment,
    error: investmentError,
  } = await supabase
    .from("investments")
    .insert([investment])
    .select()
    .single();

  if (investmentError) {
    console.error(
      "INVESTMENT INSERT ERROR:",
      investmentError
    );

    throw investmentError;
  }

  // =====================================================
  // 3. CREATE BILLING ENTRY
  // =====================================================

  let billingEntry = {
    date:
      savedInvestment.investment_date,

    type: "Expense",

    company: "Investment",

    paid_by:
      partner.partner_name,

    payment_mode:
      savedInvestment.payment_mode,

    amount:
      Number(savedInvestment.amount),

    remarks:
      savedInvestment.purpose || "",

    source_type:
      "Investment",

    source_id:
      savedInvestment.id,
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

      remarks:
        "Dealer Payment",
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

      remarks:
        "Vendor Payment",
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

      remarks:
        "Miscellaneous",
    };
  }

  // =====================================================
  // INSERT BILLING
  // =====================================================

  const {
    data: billingData,
    error: billingError,
  } = await supabase
    .from("billing")
    .insert([billingEntry])
    .select()
    .single();

  if (billingError) {
    console.error(
      "FINANCE LEDGER INSERT ERROR:",
      billingError
    );

    await supabase
      .from("investments")
      .delete()
      .eq(
        "id",
        savedInvestment.id
      );

    throw billingError;
  }

  console.log(
    "FINANCE LEDGER ENTRY CREATED:",
    billingData
  );

  return savedInvestment;
}

// =====================================================
// UPDATE INVESTMENT
// =====================================================

export async function updateInvestment(
  id,
  investment
) {
  // =====================================================
  // 1. GET INVESTOR NAME
  // =====================================================

  const {
    data: partner,
    error: partnerError,
  } = await supabase
    .from("partners")
    .select("partner_name")
    .eq("id", investment.partner_id)
    .single();

  if (partnerError) {
    console.error(
      "INVESTOR FETCH ERROR:",
      partnerError
    );

    throw partnerError;
  }

  // =====================================================
  // 2. UPDATE INVESTMENT
  // =====================================================

  const {
    data: updatedInvestment,
    error: investmentError,
  } = await supabase
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
    date:
      updatedInvestment.investment_date,

    type: "Expense",

    company: "Investment",

    paid_by:
      partner.partner_name,

    payment_mode:
      updatedInvestment.payment_mode,

    amount:
      Number(updatedInvestment.amount),

    remarks:
      updatedInvestment.purpose || "",
  };

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

      remarks:
        "Dealer Payment",
    };
  }

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

      remarks:
        "Vendor Payment",
    };
  }

  else if (
    updatedInvestment.investment_type ===
    "Miscellaneous"
  ) {
    billingEntry = {
      ...billingEntry,

      type: "Expense",

      company: "Miscellaneous",

      remarks:
        "Miscellaneous",
    };
  }

  // =====================================================
  // 4. CHECK WHETHER THIS IS AN EXPENSE INVESTMENT
  // =====================================================

  const {
    data: expenseInvestment,
    error: expenseInvestmentError,
  } = await supabase
    .from("investments")
    .select("billing_id, investment_type")
    .eq("id", id)
    .maybeSingle();

  if (expenseInvestmentError) {
    console.error(
      "EXPENSE INVESTMENT LOOKUP ERROR:",
      expenseInvestmentError
    );

    throw expenseInvestmentError;
  }

  // =====================================================
  // 5. UPDATE BILLING
  //
  // NORMAL INVESTMENT:
  // source_type = Investment
  // source_id   = investment ID
  //
  // EXPENSE INVESTMENT:
  // billing_id points to original billing Expense
  // =====================================================

  let billingQuery;

  if (
    expenseInvestment?.investment_type ===
    "Expense Investment" &&
    expenseInvestment?.billing_id
  ) {
    billingQuery = supabase
      .from("billing")
      .update({
        date:
          updatedInvestment.investment_date,

        type: "Expense",

        company:
          updatedInvestment.purpose ||
          "Expense",

        paid_by:
          partner.partner_name,

        payment_mode:
          updatedInvestment.payment_mode,

        amount:
          Number(
            updatedInvestment.amount || 0
          ),

        remarks:
          updatedInvestment.remarks ||
          "",
      })
      .eq(
        "id",
        expenseInvestment.billing_id
      )
      .select()
      .single();
  } else {
    billingQuery = supabase
      .from("billing")
      .update(
        billingEntry
      )
      .eq(
        "source_type",
        "Investment"
      )
      .eq(
        "source_id",
        id
      )
      .select()
      .single();
  }

  const {
    data: billingData,
    error: billingError,
  } = await billingQuery;

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
//
// IMPORTANT:
//
// Normal Investment:
// Investment -> Billing
//
// Expense Investment:
// Investment -> Original Expense Billing
//
// Deleting the Investment therefore also deletes the
// original Expense transaction.
// =====================================================

export async function deleteInvestment(id) {
  // =====================================================
  // 1. FIND INVESTMENT
  // =====================================================

  const {
    data: investment,
    error: investmentFetchError,
  } = await supabase
    .from("investments")
    .select(
      "id, billing_id, investment_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (investmentFetchError) {
    console.error(
      "INVESTMENT FETCH ERROR:",
      investmentFetchError
    );

    throw investmentFetchError;
  }

  if (!investment) {
    console.warn(
      "Investment not found:",
      id
    );

    return;
  }

  // =====================================================
  // 2. DELETE BILLING ENTRY
  // =====================================================

  if (
    investment.investment_type ===
      "Expense Investment" &&
    investment.billing_id
  ) {
    // ---------------------------------------------------
    // EXPENSE INVESTMENT
    //
    // Delete the ORIGINAL Expense transaction.
    // ---------------------------------------------------

    const {
      error: billingError,
    } = await supabase
      .from("billing")
      .delete()
      .eq(
        "id",
        investment.billing_id
      );

    if (billingError) {
      console.error(
        "EXPENSE BILLING DELETE ERROR:",
        billingError
      );

      throw billingError;
    }
  } else {
    // ---------------------------------------------------
    // NORMAL INVESTMENT
    //
    // Existing behavior remains unchanged.
    // ---------------------------------------------------

    const {
      error: billingError,
    } = await supabase
      .from("billing")
      .delete()
      .eq(
        "source_type",
        "Investment"
      )
      .eq(
        "source_id",
        id
      );

    if (billingError) {
      console.error(
        "FINANCE LEDGER DELETE ERROR:",
        billingError
      );

      throw billingError;
    }
  }

  // =====================================================
  // 3. DELETE INVESTMENT
  // =====================================================

  const {
    error: investmentError,
  } = await supabase
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
    "INVESTMENT AND LINKED FINANCE LEDGER ENTRY DELETED:",
    id
  );
}

// =====================================================
// EXPENSE INVESTOR HELPERS
// =====================================================

const EXPENSE_INVESTOR_NAMES = [
  "Prashun Dixit",
  "Shaubhendu Dixit",
  "Vipin Saxena",
];

// =====================================================
// CHECK IF PAID BY AN INDIVIDUAL INVESTOR
// =====================================================

function isExpenseInvestor(name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();

  return EXPENSE_INVESTOR_NAMES.some(
    (investor) =>
      investor.toLowerCase() ===
      normalized
  );
}

// =====================================================
// FIND PARTNER BY NAME
// =====================================================

async function getPartnerByName(name) {
  const {
    data,
    error,
  } = await supabase
    .from("partners")
    .select(
      "id, partner_name"
    )
    .eq(
      "is_active",
      true
    );

  if (error) {
    throw error;
  }

  const normalized =
    String(name || "")
      .trim()
      .toLowerCase();

  return (
    (data || []).find(
      (partner) =>
        String(
          partner.partner_name || ""
        )
          .trim()
          .toLowerCase() ===
        normalized
    ) || null
  );
}

// =====================================================
// CREATE / UPDATE EXPENSE INVESTMENT
//
// Expense paid by:
// Prashun Dixit
// Shaubhendu Dixit
// Vipin Saxena
//
// Shiv Shakti Solar = NO investment
// =====================================================

export async function syncExpenseInvestment(
  billingEntry
) {
  if (!billingEntry?.id) {
    throw new Error(
      "Billing ID is required for expense investment sync."
    );
  }

  if (
    String(
      billingEntry.type || ""
    )
      .trim()
      .toLowerCase() !==
    "expense"
  ) {
    return;
  }

  // =====================================================
  // FIND EXISTING LINKED INVESTMENT
  // =====================================================

  const {
    data: existingInvestment,
    error: existingError,
  } = await supabase
    .from("investments")
    .select("*")
    .eq(
      "billing_id",
      billingEntry.id
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  // =====================================================
  // SHIV SHAKTI SOLAR
  //
  // No investor investment.
  // =====================================================

  if (
    !isExpenseInvestor(
      billingEntry.paid_by
    )
  ) {
    if (existingInvestment) {
      const {
        error,
      } = await supabase
        .from("investments")
        .delete()
        .eq(
          "id",
          existingInvestment.id
        );

      if (error) {
        throw error;
      }
    }

    return;
  }

  // =====================================================
  // FIND PARTNER
  // =====================================================

  const partner =
    await getPartnerByName(
      billingEntry.paid_by
    );

  if (!partner) {
    throw new Error(
      `Investor "${billingEntry.paid_by}" was not found in Partners.`
    );
  }

  // =====================================================
  // INVESTMENT DATA
  // =====================================================

  const investmentData = {
    partner_id:
      partner.id,

    investment_date:
      billingEntry.date,

    investment_type:
      "Expense Investment",

    dealer_name:
      null,

    vendor_name:
      null,

    amount:
      Number(
        billingEntry.amount || 0
      ),

    payment_mode:
      billingEntry.payment_mode ||
      "Cash",

    reference_no:
      null,

    purpose:
      billingEntry.company ||
      "Expense",

    remarks:
      billingEntry.remarks ||
      "",

    // IMPORTANT:
    // This creates the two-way relationship.
    billing_id:
      billingEntry.id,
  };

  // =====================================================
  // UPDATE EXISTING INVESTMENT
  // =====================================================

  if (existingInvestment) {
    const {
      error,
    } = await supabase
      .from("investments")
      .update(
        investmentData
      )
      .eq(
        "id",
        existingInvestment.id
      );

    if (error) {
      throw error;
    }

    return;
  }

  // =====================================================
  // CREATE NEW INVESTMENT
  // =====================================================

  const {
    error,
  } = await supabase
    .from("investments")
    .insert([
      investmentData,
    ]);

  if (error) {
    throw error;
  }
}

// =====================================================
// DELETE EXPENSE INVESTMENT
//
// Called when deleting the original Expense from
// Finance Ledger.
//
// billingId = original billing Expense ID
// =====================================================

export async function deleteExpenseInvestment(
  billingId
) {
  if (!billingId) {
    return;
  }

  const {
    error,
  } = await supabase
    .from("investments")
    .delete()
    .eq(
      "billing_id",
      billingId
    );

  if (error) {
    throw error;
  }
}