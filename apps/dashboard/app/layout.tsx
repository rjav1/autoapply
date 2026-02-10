import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "AutoApply - Job Application Automation",
  description: "Automate your job applications on Workday, Greenhouse, and more",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
