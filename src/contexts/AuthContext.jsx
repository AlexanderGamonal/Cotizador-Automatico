import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // session: undefined = cargando, null = sin sesión
  const [session, setSession] = useState(undefined);
  // isMember: undefined = comprobando
  const [isMember, setIsMember] = useState(undefined);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    supabase.rpc('is_member').then(({ data, error }) => {
      if (!cancelled) setIsMember(error ? false : Boolean(data));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    setIsMember(undefined);
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    isMember: session ? isMember : false,
    signIn,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
