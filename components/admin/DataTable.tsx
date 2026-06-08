'use client'
import { ReactNode } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  keyField?: string
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading,
  emptyText = 'Geen resultaten gevonden',
  keyField = 'id',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-[var(--color-muted)] whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--color-muted)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String((row as Record<string, unknown>)[keyField] ?? i)}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--color-text)]">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
