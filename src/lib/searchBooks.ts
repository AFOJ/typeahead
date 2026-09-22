import type { AutocompleteOption } from "@/components/autocomplete/Autocomplete"
import type { Book } from "@/app/api/books/route"

export async function searchBooks(
  query: string,
): Promise<AutocompleteOption[]> {
  const url = new URL("/api/books", window.location.origin)
  url.searchParams.set("q", query)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Books request failed with status ${response.status}`)
  }

  const books: Book[] = await response.json()

  return books.map(toOption)
}

function toOption(book: Book): AutocompleteOption {
  const label = [
    book.title,
    book.year !== null ? `(${book.year})` : null,
    book.author ? `— ${book.author}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" ")

  return { id: book.id, label }
}
