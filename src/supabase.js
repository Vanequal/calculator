import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrmugdayjzmvafamytja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXVnZGF5anptdmFmYW15dGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNDAxNzcsImV4cCI6MjA2MjgxNjE3N30.WcFN5jeGm244oQuPm3TmstdfSNO9xBwF5W7o4LVysw0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
