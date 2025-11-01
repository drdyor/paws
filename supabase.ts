import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// ⛔ You can swap these for env-driven values later.
// For quick boot/testing, this is fine while the project is private.
const supabaseUrl = "https://bdpbjsciaekgcdpvqomr.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcGJqc2NpYWVrZ2NkcHZxb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjA0NDQsImV4cCI6MjA3NzU5NjQ0NH0.MvurqAkzprNUa3JFYnfWLh1jiUMJZhfltct8VCYIO4A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true }
});