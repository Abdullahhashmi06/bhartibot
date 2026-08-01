import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

async function run() {
  const { data, error } = await supabase.from('internships').select('id, status').eq('status', 'published').limit(1);
  if (error || !data.length) return console.error('No published internships', error);
  
  const id = data[0].id;
  console.log('Found internship:', id);
  
  const { data: app, error: err } = await supabase.from('applications').insert({
    internship_id: id,
    applicant_name: 'Test',
    email: 'test@test.com',
    status: 'new'
  }).select();
  
  console.log('Insert Result:', app, err);
}
run();
