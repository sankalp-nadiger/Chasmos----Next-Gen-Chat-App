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


export const uploadBase64ImageToSupabase = async (
  base64,
  bucket = "avatars",
  folder = "users"
) => {
  if (!supabase) {
    throw new Error("Supabase not initialized");
  }

  try {
    // ✅ Detect image type dynamically
    const matches = base64.match(/^data:image\/(\w+);base64,/);
    if (!matches) throw new Error("Invalid base64 image format");

    const ext = matches[1]; // e.g., png, jpeg, webp
    const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`; // normalize jpg → jpeg

    // Convert base64 to buffer
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");

    // File path in Supabase storage
    const filePath = `${folder}/${uuidv4()}.${ext}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType, upsert: false });

    if (error) throw error;

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Failed to generate public URL");

    return data.publicUrl; // ✅ Store this in MongoDB
  } catch (err) {
    console.error("❌ Supabase image upload error:", err.message);
    throw err;
  }
};