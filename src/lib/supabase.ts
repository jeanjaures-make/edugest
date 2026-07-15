import { createBrowserClient } from "@supabase/ssr"

// Fallbacks de repli : utilisés uniquement si les variables d'env sont absentes
// (ex: build-check CI sans secrets). En local et sur Vercel, les vraies valeurs sont injectées.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
)
