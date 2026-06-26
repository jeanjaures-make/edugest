import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { checkRateLimit } from "@/lib/rate-limiter"
import { headers } from "next/headers"

export async function POST(request: Request) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "TROP_DE_REQUETES", message: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const body = await request.json()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error) {
    return NextResponse.json(
      { error: "AUTH_FAILED", message: "Email ou mot de passe incorrect" },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: data.user })
}
