import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvfgnixsbbbrrquckgng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZmduaXhzYmJicnJxdWNrZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODE3NjIsImV4cCI6MjEwNTA1Nzc2Mn0.bg2Z_4zYZi6WPO0tsSpNl2z9VPfVnMCoNSsgmyUNmSE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  const email = 'satyamsahani293@gmail.com';
  const password = 'RealmeSatyam@531#';

  console.log('Creating Admin User via Supabase Auth API...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.log('SignUp Error:', error.message);
    // If already registered, try signing in to update role
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error('SignIn Error:', signInError.message);
      return;
    }
    if (signInData.user) {
      await supabase.from('profiles').upsert([
        {
          id: signInData.user.id,
          email,
          phone: '9876543210',
          role: 'SUPER_ADMIN',
        },
      ]);
      console.log('SUCCESS: Admin profile updated to SUPER_ADMIN!');
    }
    return;
  }

  if (data.user) {
    await supabase.from('profiles').upsert([
      {
        id: data.user.id,
        email,
        phone: '9876543210',
        role: 'SUPER_ADMIN',
      },
    ]);
    console.log('SUCCESS: Super Admin Account Created Successfully!');
  }
}

createAdmin();
