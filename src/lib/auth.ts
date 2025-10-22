import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
});

export const signUp = async (email: string, password: string) => {
  const validation = authSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: { message: validation.error.errors[0].message } };
  }

  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  return { error };
};

export const signIn = async (email: string, password: string) => {
  const validation = authSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: { message: validation.error.errors[0].message } };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
