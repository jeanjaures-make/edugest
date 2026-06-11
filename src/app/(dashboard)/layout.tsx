import { cookies } from "next/headers"
import ClientLayout from "./client-layout"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await cookies()
  return <ClientLayout>{children}</ClientLayout>
}
