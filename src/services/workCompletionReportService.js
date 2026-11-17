
import { supabase } from "./supabase";

const TABLE = "work_completion_reports";

export async function getWorkCompletionReports() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("report_no", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addWorkCompletionReport(reportData = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ report_data: reportData }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkCompletionReport(id, reportData) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ report_data: reportData })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkCompletionReport(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getWorkCompletionReportById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}