// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://adkxigojicsxkavxtqms.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka3hpZ29qaWNzeGthdnh0cW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MTQwMTQsImV4cCI6MjA0NjA5MDAxNH0.Ayz1CG2nVx2PaWHKNY3Hy0Hy2-ngejvJ1fJC-WPoyPY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);