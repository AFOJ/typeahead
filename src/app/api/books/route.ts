import { NextRequest, NextResponse } from "next/server"

type OpenLibraryDoc = {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
}

export type Book = {
  id: string
  title: string
  author: string | null
  year: number | null
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    )
  }

  const url = new URL("https://openlibrary.org/search.json")
  url.searchParams.set("q", query)
  url.searchParams.set("fields", "key,title,author_name,first_publish_year")
  url.searchParams.set("limit", "8")

  const response = await fetch(url)

  if (!response.ok) {
    return NextResponse.json(
      { error: `Upstream search failed with status ${response.status}` },
      { status: response.status },
    )
  }

  const payload: { docs: OpenLibraryDoc[] } = await response.json()

  return NextResponse.json(payload.docs.map(toBook))
}

function toBook(doc: OpenLibraryDoc): Book {
  return {
    id: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    year: doc.first_publish_year ?? null,
  }
}
