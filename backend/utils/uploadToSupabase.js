import supabase from "./supabaseClient.js";

export const uploadFileToSupabase = async (file, bucket = "documents") => {
  if (!supabase) return { success: false, error: "Supabase not initialized" };

  try {
    const fileName = `${Date.now()}_${file.originalname}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { success: true, fileUrl: publicUrl, fileName };
  } catch (err) {
    console.error("❌ Supabase upload error:", err.message);
    return { success: false, error: err.message };
  }
};
