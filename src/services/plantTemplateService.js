import { supabase } from "./supabase";

export async function getPlantTemplates() {
  const { data, error } = await supabase
    .from("plant_templates")
    .select("*")
    .order("plant_size");

  if (error) throw error;

  return data;
}

export async function getPlantTemplate(id) {
  const { data, error } = await supabase
    .from("plant_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function addPlantTemplate(template) {
  const { error } = await supabase
    .from("plant_templates")
    .insert(template);

  if (error) throw error;
}

export async function updatePlantTemplate(id, template) {
  const { error } = await supabase
    .from("plant_templates")
    .update({
      ...template,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deletePlantTemplate(id) {
  const { error } = await supabase
    .from("plant_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}