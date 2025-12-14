import supabase from "./supabaseHelper.js";
import { v4 as uuidv4 } from "uuid";

export const uploadFileToSupabase = async (file, bucket = "documents") => {
  if (!supabase) return { success: false, error: "Supabase not initialized" };

  try {
    const uniqueFileName = `${Date.now()}_${file.originalname}`;
    const filePath = `${uuidv4()}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      throw new Error("Failed to generate public URL");
    }

    return { success: true, fileUrl: publicUrl, filePath, fileName: uniqueFileName };
  } catch (err) {
    console.error("❌ Supabase upload error:", err.message);
    return { success: false, error: err.message };
  }
};
