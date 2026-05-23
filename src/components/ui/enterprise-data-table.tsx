"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Settings,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";

interface EnterpriseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowSelect?: (rows: TData[]) => void;
  pageSize?: number;
  searchKey?: string;
  searchPlaceholder?: string;
}

export function EnterpriseDataTable<TData extends { id?: string | number }, TValue>({
  columns,
  data,
  onRowSelect,
  pageSize = 20,
  searchKey,
  searchPlaceholder = "Search...",
}: EnterpriseDataTableProps<TData, TValue>) {
  const t = useTranslations();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("compact");
  const [searchValue, setSearchValue] = useState("");
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchValue,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "auto",
  });

  const selectedRows = useMemo(
    () => table.getFilteredSelectedRowModel().rows.map((row) => row.original),
    [rowSelection]
  );

  // Notify parent of row selection changes
  React.useEffect(() => {
    onRowSelect?.(selectedRows);
  }, [selectedRows.length, onRowSelect]);

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize_ = table.getState().pagination.pageSize;
  const total = table.getPrePaginationRowModel().rows.length;
  const start = pageIndex * pageSize_ + 1;
  const end = Math.min((pageIndex + 1) * pageSize_, total);

  const densityClasses = {
    compact: { py: "px-4 py-2", text: "text-xs" },
    comfortable: { py: "px-4 py-3", text: "text-sm" },
    spacious: { py: "px-4 py-4", text: "text-sm" },
  };

  const current = densityClasses[density];

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        {searchKey && (
          <div className="flex-1 max-w-sm">
            <input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted">
                {selectedRows.length} selected
              </span>
              <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors" title="Delete selected">
                <Trash2 className="w-4 h-4 text-danger-500" />
              </button>
            </div>
          )}

          {/* Density Control */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            {(["compact", "comfortable", "spacious"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  density === d ? "bg-primary-50 text-primary" : "text-text-muted hover:text-text"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setColumnSettingsOpen(!columnSettingsOpen)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              title="Column settings"
            >
              <Settings className="w-4 h-4 text-text-muted" />
            </button>

            {columnSettingsOpen && (
              <div className="absolute right-0 top-10 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 p-2">
                <p className="text-xs font-semibold text-text-muted px-2 py-2">Columns</p>
                <div className="space-y-1">
                  {table.getAllColumns().map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-hover rounded cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={(e) => column.toggleVisibility(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-text-muted">{column.columnDef.header as string}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background border-b border-border text-text-muted text-xs font-medium sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {/* Checkbox Column */}
                  <th className={`${current.py} w-12`}>
                    <input
                      type="checkbox"
                      checked={table.getIsAllPageRowsSelected()}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = table.getIsSomePageRowsSelected();
                        }
                      }}
                      onChange={table.getToggleAllPageRowsSelectedHandler()}
                      className="rounded"
                    />
                  </th>

                  {/* Data Columns */}
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`${current.py} whitespace-nowrap text-text-muted font-medium`}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.columnDef.header && (
                          <ChevronDown className="w-3 h-3 text-text-muted opacity-40" />
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Actions Column */}
                  <th className={`${current.py} w-12`}></th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border text-text">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-hover transition-colors group">
                    {/* Checkbox */}
                    <td className={`${current.py}`}>
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="rounded"
                      />
                    </td>

                    {/* Data Cells */}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`${current.py} ${current.text}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className={`${current.py}`}>
                      <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-surface rounded transition-all">
                        <MoreHorizontal className="w-4 h-4 text-text-muted" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 2} className="h-24 text-center text-text-muted">
                    {t("table.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
          <div className="text-xs text-text-muted">
            {total > 0 ? `Showing ${start} to ${end} of ${total}` : "No results"}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 border border-border rounded-lg text-text-muted hover:bg-surface hover:text-text disabled:opacity-40 transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 border border-border rounded-lg text-text-muted hover:bg-surface hover:text-text disabled:opacity-40 transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
