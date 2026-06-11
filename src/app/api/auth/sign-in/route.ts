import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
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
    const message =
      error.code === "email_not_confirmed"
        ? "Veuillez confirmer votre email avant de vous connecter"
        : error.code === "user_not_found"
          ? "Aucun compte trouvé avec cet email"
          : "Email ou mot de passe incorrect"
    return Response.json(
      { error: error.code || "AUTH_FAILED", message },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: data.user })
}
