import React, { useState, useRef, useCallback, useEffect } from 'react'
import { searchService } from '../../services/api'
import SearchResultItem from './SearchResultItem'

const TABS = [
  { key: 'ALL', label: '\uC804\uCCB4' },
  { key: 'CHAT', label: '\uCC44\uD305' },
  { key: 'SNIPPET', label: '\uC2A4\uB2C8\uD3AB' },
  { key: 'MEMO', label: '\uBA54\uBAA8' },
]

function SearchContainer({ workspaceId, onNavigate }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ALL')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(
    async (keyword, searchType) => {
      if (!keyword || keyword.trim().length < 2) {
        setResults(null)
        return
      }
      setIsLoading(true)
      setError('')
      try {
        const response = await searchService.search(workspaceId, keyword.trim(), searchType)
        setResults(response.data)
      } catch (err) {
        setError('\uAC80\uC0C9 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.')
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    },
    [workspaceId]
  )

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value, type)
    }, 300)
  }

  const handleTypeChange = (newType) => {
    setType(newType)
    if (query.trim().length >= 2) {
      doSearch(query, newType)
    }
  }

  const handleResultClick = (resultType) => {
    if (onNavigate) {
      const tabMap = { chat: 'chat', snippet: 'snippets', memo: 'memos' }
      onNavigate(tabMap[resultType] || 'chat')
    }
  }

  const totalCount = results?.totalCount || 0
  const hasResults = results && totalCount > 0

  return (
    <div className="h-full flex flex-col">
      {/* Search Input */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white/40 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694 (2\uAE00\uC790 \uC774\uC0C1)"
            className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults(null)
                inputRef.current?.focus()
              }}
              className="text-white/40 hover:text-white/70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="px-4 pb-2 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTypeChange(tab.key)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              type === tab.key
                ? 'bg-indigo-500/30 text-indigo-300'
                : 'text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">
            \uAC80\uC0C9 \uC911...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-300 text-sm">{error}</div>
        ) : query.trim().length < 2 ? (
          <div className="p-8 text-center text-white/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-3 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm">\uCC44\uD305, \uC2A4\uB2C8\uD3AB, \uBA54\uBAA8\uB97C \uD1B5\uD569 \uAC80\uC0C9\uD569\uB2C8\uB2E4</p>
          </div>
        ) : !hasResults ? (
          <div className="p-8 text-center text-white/40 text-sm">
            <p>'{query}'\uC5D0 \uB300\uD55C \uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4</p>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 text-xs text-white/40">
              \uAC80\uC0C9 \uACB0\uACFC {totalCount}\uAC74
            </div>

            {results.messages?.length > 0 && (type === 'ALL' || type === 'CHAT') && (
              <div>
                {type === 'ALL' && (
                  <div className="px-4 py-1.5 text-xs font-medium text-white/50 bg-white/5">
                    \uCC44\uD305 ({results.messages.length})
                  </div>
                )}
                {results.messages.map((msg) => (
                  <SearchResultItem
                    key={`chat-${msg.id}`}
                    result={msg}
                    type="chat"
                    keyword={query}
                    onClick={() => handleResultClick('chat')}
                  />
                ))}
              </div>
            )}

            {results.snippets?.length > 0 && (type === 'ALL' || type === 'SNIPPET') && (
              <div>
                {type === 'ALL' && (
                  <div className="px-4 py-1.5 text-xs font-medium text-white/50 bg-white/5">
                    \uC2A4\uB2C8\uD3AB ({results.snippets.length})
                  </div>
                )}
                {results.snippets.map((snippet) => (
                  <SearchResultItem
                    key={`snippet-${snippet.id}`}
                    result={snippet}
                    type="snippet"
                    keyword={query}
                    onClick={() => handleResultClick('snippet')}
                  />
                ))}
              </div>
            )}

            {results.memos?.length > 0 && (type === 'ALL' || type === 'MEMO') && (
              <div>
                {type === 'ALL' && (
                  <div className="px-4 py-1.5 text-xs font-medium text-white/50 bg-white/5">
                    \uBA54\uBAA8 ({results.memos.length})
                  </div>
                )}
                {results.memos.map((memo) => (
                  <SearchResultItem
                    key={`memo-${memo.id}`}
                    result={memo}
                    type="memo"
                    keyword={query}
                    onClick={() => handleResultClick('memo')}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchContainer
