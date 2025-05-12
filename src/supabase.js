import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezamekuocegfdkdyucub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YW1la3VvY2VnZmRrZHl1Y3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjMxODIsImV4cCI6MjA2MjU5OTE4Mn0.k2PLXjLLwEeUEZxg3PkCW5Fq5alkVi9GwYaCCDXh5w4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
