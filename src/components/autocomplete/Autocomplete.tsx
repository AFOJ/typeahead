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
  [key: string]: unknown
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
  emptyMessage?: string
  queryKey?: readonly unknown[]
  getOptionLabel?: (option: T) => string
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
    emptyMessage = "No items",
    queryKey = ["autocomplete"],
    getOptionLabel = (o) => o.label,
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

  const [debouncedQuery, setDebouncedImmediate] = useDebouncedValue(
    query,
    debounceMs,
  )
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
    isError,
  } = useQuery({
    queryKey: [...queryKey, trimmedQuery],
    queryFn: ({ signal }) => search(trimmedQuery, { signal }),
    enabled: isQueryReady,
    placeholderData: keepPreviousData,
  })

  const visibleResults = results.slice(0, maxResults)
  const showOptions = isOpen && visibleResults.length > 0
  const showEmptyState =
    !isError && !isFetching && isQueryReady && visibleResults.length === 0
  const activeId =
    activeIndex !== null && activeIndex < visibleResults.length
      ? `${listboxId}-${activeIndex}`
      : undefined

  const selectOption = (option: T) => {
    const label = getOptionLabel(option)
    setQuery(label)
    setDebouncedImmediate(label)
    setActiveIndex(null)
    setIsOpen(false)
    onChange(option)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setActiveIndex(null)
    setIsOpen(true)
  }

  const handleBlur = () => {
    setIsOpen(false)
    setActiveIndex(null)
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

  const dropdownContent = showOptions ? (
    <ul
      id={listboxId}
      role="listbox"
      aria-label={label}
      className="max-h-60 overflow-y-auto"
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
            activeIndex === index ? "bg-blue-100" : "hover:bg-blue-50",
          )}
        >
          {getOptionLabel(option)}
        </li>
      ))}
    </ul>
  ) : isError ? (
    <p className="px-3 py-2 text-sm text-red-600">
      Couldn&apos;t load results.
    </p>
  ) : showEmptyState ? (
    <p className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</p>
  ) : null

  return (
    <div className="relative block">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
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
          aria-busy={isFetching}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-9 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        {isFetching && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-2 flex items-center"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          </span>
        )}
      </div>
      {dropdownContent && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
          {dropdownContent}
        </div>
      )}
    </div>
  )
}
