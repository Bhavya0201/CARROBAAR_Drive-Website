require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('⚡ Supabase Client initialized successfully.');
    } catch (err) {
        console.error('❌ Failed to initialize Supabase client:', err.message);
    }
} else {
    console.warn('⚠️ Supabase URL or Key not found in environment variables. Falling back to local file storage.');
}

module.exports = supabase;
