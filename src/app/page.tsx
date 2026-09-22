"use client"

import { useState } from "react"
import Autocomplete, {
  type AutocompleteOption,
} from "@/components/autocomplete/Autocomplete"
import { searchBooks } from "@/lib/searchBooks"

export default function Home() {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null)

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
        />
      </main>
    </div>
  )
}
