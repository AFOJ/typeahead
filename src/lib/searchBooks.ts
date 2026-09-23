import type {
  AutocompleteOption,
  SearchOptions,
} from "@/components/autocomplete/Autocomplete"
import type { Book } from "@/app/api/books/route"

export async function searchBooks(
  query: string,
  options?: SearchOptions,
): Promise<AutocompleteOption[]> {
  const url = new URL("/api/books", window.location.origin)
  url.searchParams.set("q", query)

  try {
    const response = await fetch(url, { signal: options?.signal })

    if (!response.ok) {
      throw new Error(`Books request failed with status ${response.status}`)
    }

    const books: Book[] = await response.json()
    return books.map(toOption)
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return []
    }
    throw error
  }
}

function toOption(book: Book): AutocompleteOption {
  return {
    id: book.id,
    label: book.title,
    author: book.author,
    year: book.year,
  }
}
