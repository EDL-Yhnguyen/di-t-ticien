import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Sans clés, l'application bascule en mode démo : les comptes et les données
 * restent dans le navigateur. Tout le reste de l'app fonctionne à l'identique,
 * ce qui permet de développer et de tester sans dépendre du réseau.
 */
export const supabase: SupabaseClient | null =
  url && cle ? createClient(url, cle, { auth: { persistSession: true } }) : null

export const modeDemo = supabase === null
