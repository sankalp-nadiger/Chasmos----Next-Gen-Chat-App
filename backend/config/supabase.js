// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// let supabase = null;

// if (supabaseUrl && supabaseAnonKey) {
//   supabase = createClient(supabaseUrl, supabaseAnonKey, {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//     }
//   });
  
//   supabase.from('ai_sessions').select('count', { count: 'exact', head: true })
//     .then(({ error }) => {
//       if (error) {
//         console.error('Supabase connection failed:', error.message);
//       } else {
//         console.log('Supabase connected');
//       }
//     })
//     .catch(error => {
//       console.error('Supabase error:', error.message);
//     });
// } else {
//   console.warn('Supabase environment variables missing');
// }

// export const uploadFileToSupabase = async (file, bucket = 'documents', path = '') => {
//   if (!supabase) {
//     return {
//       success: false,
//       error: 'Supabase client not initialized'
//     };
//   }

//   try {
//     const fileExt = file.originalname.split('.').pop();
//     const fileName = `${path}${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
//     const { data, error } = await supabase.storage
//       .from(bucket)
//       .upload(fileName, file.buffer, {
//         contentType: file.mimetype,
//         upsert: false
//       });

//     if (error) {
//       throw error;
//     }

//     const { data: { publicUrl } } = supabase.storage
//       .from(bucket)
//       .getPublicUrl(fileName);

//     return {
//       success: true,
//       data,
//       publicUrl,
//       fileName
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };

// export const deleteFileFromSupabase = async (fileName, bucket = 'documents') => {
//   if (!supabase) {
//     return {
//       success: false,
//       error: 'Supabase client not initialized'
//     };
//   }

//   try {
//     const { error } = await supabase.storage
//       .from(bucket)
//       .remove([fileName]);

//     if (error) throw error;

//     return { success: true };
//   } catch (error) {
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };

// export const supabaseDb = {
//   getAISession: async (sessionId) => {
//     if (!supabase) {
//       return { data: null, error: new Error('Supabase client not initialized') };
//     }
    
//     const { data, error } = await supabase
//       .from('ai_sessions')
//       .select('*')
//       .eq('session_id', sessionId)
//       .single();
    
//     return { data, error };
//   },
  
//   createAISession: async (sessionData) => {
//     if (!supabase) {
//       return { data: null, error: new Error('Supabase client not initialized') };
//     }
    
//     const { data, error } = await supabase
//       .from('ai_sessions')
//       .insert(sessionData)
//       .select()
//       .single();
    
//     return { data, error };
//   },
  
//   updateAISession: async (sessionId, updates) => {
//     if (!supabase) {
//       return { data: null, error: new Error('Supabase client not initialized') };
//     }
    
//     const { data, error } = await supabase
//       .from('ai_sessions')
//       .update(updates)
//       .eq('session_id', sessionId)
//       .select()
//       .single();
    
//     return { data, error };
//   },
  
//   createProcessedDocument: async (docData) => {
//     if (!supabase) {
//       return { data: null, error: new Error('Supabase client not initialized') };
//     }
    
//     const { data, error } = await supabase
//       .from('processed_documents')
//       .insert(docData)
//       .select()
//       .single();
    
//     return { data, error };
//   },
  
//   getProcessedDocuments: async (sessionId) => {
//     if (!supabase) {
//       return { data: null, error: new Error('Supabase client not initialized') };
//     }
    
//     const { data, error } = await supabase
//       .from('processed_documents')
//       .select('*')
//       .eq('session_id', sessionId)
//       .order('uploaded_at', { ascending: false });
    
//     return { data, error };
//   }
// };

// export { supabase };
// export default supabase;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Check connection to Supabase
  (async () => {
    try {
      const { error } = await supabase
        .from('ai_sessions')
        .select('count', { count: 'exact', head: true });
      if (error) {
        console.error('⚠️ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (err) {
      console.error('⚠️ Supabase connection error:', err.message);
    }
  })();
} else {
  console.warn('⚠️ Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)');
}

/* --------------------------------------------
  📁 Upload a file to Supabase Storage
--------------------------------------------- */
export const uploadFileToSupabase = async (file, bucketName, folderPath = "") => {
  try {
    console.log("📁 Uploading to bucket:", bucketName);

    const filePath = `${folderPath}${Date.now()}_${file.originalname}`;
    console.log("🧾 File path:", filePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("❌ Supabase upload failed:", error.message);
      throw new Error(error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log("✅ Uploaded file URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("❌ uploadFileToSupabase error:", err.message);
    throw err;
  }
};


/* --------------------------------------------
   🗑️ Delete a file from Supabase Storage
--------------------------------------------- */
export const deleteFileFromSupabase = async (fileName, bucket = 'documents') => {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([fileName]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('❌ Supabase delete error:', error.message);
    return { success: false, error: error.message };
  }
};

/* --------------------------------------------
   💾 Supabase Database Helper Functions
--------------------------------------------- */
export const supabaseDb = {
  getAISession: async (sessionId) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    return { data, error };
  },

  createAISession: async (sessionData) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase
      .from('ai_sessions')
      .insert(sessionData)
      .select()
      .single();
    return { data, error };
  },

  updateAISession: async (sessionId, updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase
      .from('ai_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();
    return { data, error };
  },

  createProcessedDocument: async (docData) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase
      .from('processed_documents')
      .insert(docData)
      .select()
      .single();
    return { data, error };
  },

  getProcessedDocuments: async (sessionId) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });
    return { data, error };
  },
};

export { supabase };
export default supabase;