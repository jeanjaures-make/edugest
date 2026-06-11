"use client"

import * as React from "react"
import { useEffectEvent } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shimmer, ShimmerTable } from "@/components/animations/shimmer"
import { EmptyState } from "@/components/ui/empty-state"
import type { LucideIcon } from "lucide-react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  hideOnMobile?: boolean
  cell: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  emptyIcon?: LucideIcon
  onRowClick?: (item: T) => void
  getRowKey: (item: T) => string
  pageSize?: number
  mobileCard?: (item: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  loading,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé",
  emptyIcon,
  onRowClick,
  getRowKey,
  pageSize = 10,
  mobileCard,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(0)

  const filtered = React.useMemo(() => {
    let items = data
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((item) =>
        columns.some((col) => {
          const val = col.cell(item)
          return String(val).toLowerCase().includes(q)
        })
      )
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const aVal = String(columns.find((c) => c.key === sortKey)?.cell(a) ?? "")
        const bVal = String(columns.find((c) => c.key === sortKey)?.cell(b) ?? "")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }
    return items
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const onFiltersChange = useEffectEvent(() => { setPage(0) })
  React.useEffect(() => { onFiltersChange() }, [search, sortKey, sortDir])

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const visibleColumns = columns.filter((c) => !c.hideOnMobile)

  if (loading) {
    return (
      <div className="space-y-4">
        {searchable && <Shimmer className="h-10 w-full max-w-sm rounded-lg" />}
        <ShimmerTable rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(col.sortable && "cursor-pointer select-none hover:text-foreground")}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === "asc"
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                        : <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length}>
                  <EmptyState
                    icon={emptyIcon || Search}
                    message={emptyMessage}
                  />
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {paged.map((item, i) => (
                  <motion.tr
                    key={getRowKey(item)}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>{col.cell(item)}</TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paged.length === 0 ? (
          <EmptyState icon={emptyIcon || Search} message={emptyMessage} />
        ) : (
          <AnimatePresence mode="popLayout">
            {paged.map((item, i) => (
              <motion.div
                key={getRowKey(item)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "rounded-xl border bg-card p-4 space-y-2",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {mobileCard ? (
                  mobileCard(item)
                ) : (
                  columns.map((col) => (
                    <div key={col.key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{col.label}</span>
                      <span className="font-medium text-right">{col.cell(item)}</span>
                    </div>
                  ))
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} sur{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={i === page ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setPage(i)}
                className="text-xs"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
