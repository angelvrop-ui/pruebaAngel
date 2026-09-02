// auth.js - small wrapper around Supabase auth to simplify UI code
(function () {
  const SUPABASE_URL = window.SUPABASE_URL || 'REPLACE_WITH_SUPABASE_URL';
  const SUPABASE_KEY = window.SUPABASE_KEY || 'REPLACE_WITH_PUBLISHABLE_KEY';

  let supabase = null;
  function init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.error('Supabase library missing');
      return null;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabase;
  }

  async function signIn(email, password) {
    if (!supabase) init();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function signUp(email, password, metadata = {}) {
    if (!supabase) init();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
      if (error) return { data, error };
      const userId = data.user?.id;
      if (userId) {
        // try to create profile row; failure won't block the signup
        try {
          const { error: pErr } = await supabase.from('profiles').insert([{ user_id: userId, full_name: metadata.full_name || null, email, dob: metadata.dob || null }]);
          if (pErr) console.warn('profiles insert:', pErr.message || pErr);
        } catch (e) { console.warn('profiles insert exception', e); }
      }
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function getUser() {
    if (!supabase) init();
    try {
      const { data, error } = await supabase.auth.getUser();
      return { data, error };
    } catch (err) { return { data: null, error: err }; }
  }

  async function signOut() {
    if (!supabase) init();
    try { const { error } = await supabase.auth.signOut(); return { error }; } catch (err) { return { error: err }; }
  }

  // Expose simple API
  window.Auth = { init, signIn, signUp, getUser, signOut };
})();
