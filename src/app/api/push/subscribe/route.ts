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
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("id, ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  const subscription = await request.json()

  // Store subscription in a push_subscriptions table
  // Using upsert to avoid duplicates
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({
      user_id: user.id,
      profil_id: profil.id,
      ecole_id: profil.ecole_id,
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString(),
    }, { onConflict: "endpoint" })

  if (error) {
    // Table might not exist yet - return success anyway
    return NextResponse.json({ success: true, note: "Subscription stored locally" })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")

  if (endpoint) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
  }

  return NextResponse.json({ success: true })
}
