import { createClient } from '@supabase/supabase-js'

// Helper function to check environment variables
const checkEnvVars = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔧 Supabase Configuration Check:');
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
  console.log('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Not set');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables are missing!');
    console.error('   Please check your .env file in the backend directory');
    console.error('   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set');
    return false;
  }
  return true;
};

// Initialize Supabase client only if environment variables are available
let supabase = null;

if (checkEnvVars()) {
  console.log('🔗 Initializing Supabase client...');
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  // Test connection on startup
  console.log('🔄 Testing Supabase connection...');
  supabase.from('ai_sessions').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Supabase connection test failed:', error.message);
        console.log('💡 Tip: Make sure you ran the SQL setup in Supabase');
      } else {
        console.log('✅ Supabase connected and working!');
      }
    })
    .catch(error => {
      console.error('❌ Supabase connection error:', error.message);
    });
} else {
  console.warn('⚠️ Supabase client not initialized due to missing environment variables');
}

// File upload utility with error handling
export const uploadFileToSupabase = async (file, bucket = 'documents', path = '') => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return {
      success: false,
      error: 'Supabase client not initialized. Check environment variables.'
    };
  }

  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${path}${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    console.log(`📤 Uploading file to Supabase: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`✅ File uploaded successfully: ${publicUrl}`);
    
    return {
      success: true,
      data,
      publicUrl,
      fileName
    };
  } catch (error) {
    console.error('❌ Supabase upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Other functions remain the same but add supabase null checks
export const deleteFileFromSupabase = async (fileName, bucket = 'documents') => {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase client not initialized'
    };
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('❌ Supabase delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Database operations with null checks
export const supabaseDb = {
  getAISession: async (sessionId) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    return { data, error };
  },
  
  createAISession: async (sessionData) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase
      .from('ai_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    return { data, error };
  },
  
  updateAISession: async (sessionId, updates) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase
      .from('ai_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();
    
    return { data, error };
  },
  
  createProcessedDocument: async (docData) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase
      .from('processed_documents')
      .insert(docData)
      .select()
      .single();
    
    return { data, error };
  },
  
  getProcessedDocuments: async (sessionId) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase
      .from('processed_documents')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });
    
    return { data, error };
  }
};

export { supabase };
export default supabase;