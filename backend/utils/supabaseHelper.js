import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the service role key for server-side operations (bypass RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // ✅ Quick connection test
  supabase
    .from("ai_sessions")
    .select("count", { count: "exact", head: true })
    .then(({ error }) => {
      if (error) {
        console.error("❌ Supabase connection failed:", error.message);
      } else {
        console.log("✅ Supabase connected successfully");
      }
    })
    .catch((err) => console.error("⚠️ Supabase init error:", err.message));
} else {
  console.warn("⚠️ Missing Supabase environment variables! Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
}


//
// --------------------------------------------------------
// FILE STORAGE HELPERS (Uploads + Deletion)
// --------------------------------------------------------
//

/**
 * Uploads a file buffer to Supabase Storage.
 * @param {Object} file - Multer file object (with buffer, mimetype, originalname)
 * @param {string} bucket - Storage bucket name (default: 'documents')
 * @param {string} path - Folder path within bucket
 */

export const uploadFileToSupabase = async (file, bucketName, folderPath = "") => {
  try {
    console.log("📁 Uploading to bucket:", bucketName);
    console.log("🧾 File details:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const filePath = `${folderPath}${Date.now()}_${file.originalname}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase upload failed:", error);
      throw new Error(error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }

    console.log("✅ Uploaded file URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("🔥 uploadFileToSupabase error:", err.message);
    throw err;
  }
};

/**
 * Deletes a file from Supabase Storage.
 * @param {string} fileName - The file path in the bucket
 * @param {string} bucket - The bucket name
 */
export const deleteFileFromSupabase = async (
  fileName,
  bucket = "documents"
) => {
  if (!supabase) {
    return { success: false, error: "Supabase client not initialized" };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([fileName]);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("❌ Error deleting file:", err.message);
    return { success: false, error: err.message };
  }
};

//
// --------------------------------------------------------
// OPTIONAL DATABASE HELPERS (for analytics / tracking)
// --------------------------------------------------------
//

export const supabaseDb = {
  // Fetch AI session record
  getAISession: async (sessionId) => {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not initialized") };
    }
    return await supabase
      .from("ai_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single();
  },

  // Create a new AI session record
  createAISession: async (sessionData) => {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not initialized") };
    }
    return await supabase
      .from("ai_sessions")
      .insert(sessionData)
      .select()
      .single();
  },

  // Update existing AI session
  updateAISession: async (sessionId, updates) => {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not initialized") };
    }
    return await supabase
      .from("ai_sessions")
      .update(updates)
      .eq("session_id", sessionId)
      .select()
      .single();
  },

  // Create a processed document entry
  createProcessedDocument: async (docData) => {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not initialized") };
    }
    return await supabase
      .from("processed_documents")
      .insert(docData)
      .select()
      .single();
  },

  // Fetch all processed docs for a user/session
  getProcessedDocuments: async (sessionId) => {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not initialized") };
    }
    return await supabase
      .from("processed_documents")
      .select("*")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: false });
  },
};

export { supabase };
export default supabase;
