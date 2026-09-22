"use client"

import { type ChangeEvent, useId, useState } from "react"

export type AutocompleteOption = {
  id: string
  label: string
}

export type AutocompleteProps<T extends AutocompleteOption> = {
  id?: string
  label: string
  placeholder?: string
  minChars?: number
  value: T | null
  onChange: (value: T | null) => void
  search: (query: string) => Promise<T[]>
}

export default function Autocomplete<T extends AutocompleteOption>(
  props: Readonly<AutocompleteProps<T>>,
) {
  const { id, label, placeholder, minChars = 1, value, search } = props

  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`

  const [query, setQuery] = useState(value?.label ?? "")
  const [syncedValue, setSyncedValue] = useState(value)
  const [results, setResults] = useState<T[]>([])

  if (value !== syncedValue) {
    setSyncedValue(value)
    setQuery(value?.label ?? "")
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setQuery(next)
    runSearch(next)
  }

  const runSearch = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed.length < minChars) {
      setResults([])
      return
    }
    search(trimmed)
      .then(setResults)
      .catch(() => setResults([]))
  }

  return (
    <div className="block">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={inputId}
          type="text"
          value={query}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-controls={listboxId}
          onChange={handleInputChange}
          className="block w-full border px-3 py-2 outline-none"
        />
        <button
          type="button"
          onClick={() => runSearch(query)}
          className="shrink-0 border px-4 py-2 text-sm"
        >
          Search
        </button>
      </div>
      {results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="mt-1 border"
        >
          {results.map((option) => (
            <li
              key={option.id}
              id={`${listboxId}-${option.id}`}
              role="option"
              aria-selected="false"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
