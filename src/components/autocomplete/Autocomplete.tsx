"use client"

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import clsx from "clsx"
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
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
  maxResults?: number
  maxLength?: number
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
    maxResults = 5,
    maxLength = 100,
    queryKey = ["autocomplete"],
    value,
    search,
    onChange,
  } = props

  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`

  const [query, setQuery] = useState(value?.label ?? "")
  const [syncedValue, setSyncedValue] = useState(value)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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

  const { data: results = [], isFetching } = useQuery({
    queryKey: [...queryKey, trimmedQuery],
    queryFn: ({ signal }) => search(trimmedQuery, { signal }),
    enabled: isQueryReady,
    placeholderData: keepPreviousData,
  })

  const visibleResults = results.slice(0, maxResults)
  const showOptions = isOpen && visibleResults.length > 0
  const activeId =
    activeIndex !== null && activeIndex < visibleResults.length
      ? `${listboxId}-${activeIndex}`
      : undefined

  const selectOption = (option: T) => {
    setQuery(option.label)
    setSyncedValue(option)
    setActiveIndex(null)
    setIsOpen(false)
    onChange(option)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setActiveIndex(null)
    setIsOpen(true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (visibleResults.length === 0) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveIndex((current) =>
          current === null
            ? 0
            : Math.min(current + 1, visibleResults.length - 1),
        )
        setIsOpen(true)
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveIndex((current) =>
          current === null
            ? visibleResults.length - 1
            : Math.max(current - 1, 0),
        )
        setIsOpen(true)
        break
      case "Enter": {
        const option =
          activeIndex !== null && activeIndex < visibleResults.length
            ? visibleResults[activeIndex]
            : null
        if (option) {
          event.preventDefault()
          selectOption(option)
        }
        break
      }
      case "Escape":
        event.preventDefault()
        setActiveIndex(null)
        setIsOpen(false)
        break
    }
  }

  const optionId = (index: number) => `${listboxId}-${index}`

  return (
    <div className="block">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={query}
        placeholder={placeholder}
        maxLength={maxLength}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showOptions}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="mt-1 block w-full border px-3 py-2 outline-none"
      />
      {isFetching && results.length === 0 && (
        <p className="text-sm">Loading…</p>
      )}
      {showOptions && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="mt-1 border"
        >
          {visibleResults.map((option, index) => (
            <li
              key={option.id}
              id={optionId(index)}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => {
                event.preventDefault()
                selectOption(option)
              }}
              className={clsx(
                "cursor-pointer px-3 py-2",
                activeIndex === index && "bg-blue-100",
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
