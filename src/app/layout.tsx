import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Typeahead",
}

export default function RootLayout(props: Readonly<LayoutProps<"/">>) {
  const { children } = props
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
