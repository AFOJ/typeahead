"use client"

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react"
import { useDebouncedValue } from "@/lib/useDebouncedValue"

export type AutocompleteOption = {
  id: string
  label: string
}

export type SearchOptions = {
  signal?: AbortSignal
}

export type AutocompleteProps<T extends AutocompleteOption> = {
  id?: string
  label: string
  placeholder?: string
  minChars?: number
  debounceMs?: number
  queryKey?: readonly unknown[]
  value: T | null
  onChange: (value: T | null) => void
  search: (query: string, options?: SearchOptions) => Promise<T[]>
}

export default function Autocomplete<T extends AutocompleteOption>(
  props: Readonly<AutocompleteProps<T>>,
) {
  const {
    id,
    label,
    placeholder,
    minChars = 1,
    debounceMs = 500,
    queryKey = ["autocomplete"],
    value,
    search,
  } = props

  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`

  const [query, setQuery] = useState(value?.label ?? "")
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setQuery(value?.label ?? "")
  }

  const debouncedQuery = useDebouncedValue(query, debounceMs)
  const trimmedQuery = debouncedQuery.trim()

  const isQueryReady = trimmedQuery.length >= minChars

  const queryClient = useQueryClient()
  const previousTrimmedQueryRef = useRef(trimmedQuery)

  useEffect(() => {
    if (previousTrimmedQueryRef.current !== trimmedQuery) {
      queryClient.cancelQueries({
        queryKey: [...queryKey, previousTrimmedQueryRef.current],
      })
      previousTrimmedQueryRef.current = trimmedQuery
    }
  }, [queryClient, queryKey, trimmedQuery])

  const {
    data: results = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, trimmedQuery],
    queryFn: ({ signal }) => search(trimmedQuery, { signal }),
    enabled: isQueryReady,
    placeholderData: keepPreviousData,
  })

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
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
          disabled={!isQueryReady}
          onClick={() => refetch()}
          className="shrink-0 border px-4 py-2 text-sm"
        >
          Search
        </button>
      </div>
      {isFetching && results.length === 0 && (
        <p className="text-sm">Loading…</p>
      )}
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
