"use client"

import { useState } from "react"
import Autocomplete, {
  type AutocompleteOption,
} from "@/components/autocomplete/Autocomplete"
import { searchBooks } from "@/lib/searchBooks"

type BookOption = AutocompleteOption & {
  author?: string
  year?: number | null
}

function AuthorYear({
  author,
  year,
}: {
  author?: string
  year?: number | null
}) {
  if (!author && (year === null || year === undefined)) {
    return null
  }
  return (
    <p className="text-gray-500">
      {author && year !== null && year !== undefined && `${author} | ${year}`}
      {author && (year === null || year === undefined) && author}
      {!author && year !== null && year !== undefined && year}
    </p>
  )
}

export default function Home() {
  const [selected, setSelected] = useState<BookOption | null>(null)

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-8 bg-white py-32 px-16 sm:items-start">
        <h1 className="text-4xl font-bold">Typeahead</h1>
        <Autocomplete
          label="Search books"
          placeholder="e.g. neuromancer"
          minChars={3}
          value={selected}
          onChange={setSelected}
          search={searchBooks}
          getOptionLabel={(o) =>
            o.author ? `${o.label} (${o.author})` : o.label
          }
        />
        {selected && (
          <div className="w-full">
            <p className="text-sm text-gray-600 mb-2">
              Showing results for: <strong>{selected.label}</strong>
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2 text-sm">
              <li key={selected.id}>
                <span className="font-medium">{selected.label}</span>
                <AuthorYear author={selected.author} year={selected.year} />
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
