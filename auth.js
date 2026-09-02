// auth.js - small wrapper around Supabase auth to simplify UI code
(function () {
  const SUPABASE_URL = window.SUPABASE_URL || 'REPLACE_WITH_SUPABASE_URL';
  const SUPABASE_KEY = window.SUPABASE_KEY || 'REPLACE_WITH_PUBLISHABLE_KEY';

  let supabase = null;
  function findCreateClient() {
    return (window.supabase && window.supabase.createClient)
      || (window.supabaseJs && window.supabaseJs.createClient)
      || (window.supabaseLib && window.supabaseLib.createClient)
      || (window.Supabase && window.Supabase.createClient)
      || null;
  }

  async function init() {
    if (supabase) return supabase;
    let createClient = findCreateClient();
    if (createClient) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    }
    // try a short polling loop in case the SDK is still loading
    const start = Date.now();
    const timeout = 2000; // ms
    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, 100));
      createClient = findCreateClient();
      if (createClient) {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabase;
      }
    }
    console.error('Supabase library not found (after waiting)');
    return null;
  }

  async function signIn(email, password) {
    await init();
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function signUp(email, password, metadata = {}) {
    await init();
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
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
    await init();
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    try {
      const { data, error } = await supabase.auth.getUser();
      return { data, error };
    } catch (err) { return { data: null, error: err }; }
  }

  async function signOut() {
    await init();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    try { const { error } = await supabase.auth.signOut(); return { error }; } catch (err) { return { error: err }; }
  }

  // Expose simple API
  window.Auth = { init, signIn, signUp, getUser, signOut };
})();
