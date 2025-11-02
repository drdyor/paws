// services/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Your Supabase credentials - directly wired to hit your database
const supabaseUrl = "https://bdpbjsciaekgcdpvqomr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcGJqc2NpYWVrZ2NkcHZxb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjA0NDQsImV4cCI6MjA3NzU5NjQ0NH0.MvurqAkzprNUa3JFYnfWLh1jiUMJZhfltct8VCYIO4A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});