"use client";

import { useTranslations } from "next-intl";
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  expandedRowId?: string | null;
  renderExpanded?: (row: TData) => React.ReactNode;
}

export function DataTable<TData extends { id?: string }, TValue>({ columns, data, expandedRowId, renderExpanded }: DataTableProps<TData, TValue>) {
  const t = useTranslations();

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const total = table.getPrePaginationRowModel().rows.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="w-full">
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-secondary border-b border-border text-text-muted text-[11.5px] font-bold uppercase tracking-wider">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isActions = header.column.id === "actions";
                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3 whitespace-nowrap ${
                          isActions ? "sticky right-0 z-10 bg-surface-secondary shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]" : ""
                        }`}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-light text-text">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr key={row.id} className="group hover:bg-surface-hover transition-colors">
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === "actions";
                        return (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 whitespace-nowrap ${
                              isActions
                                ? "sticky right-0 z-10 bg-surface group-hover:bg-surface-hover shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.1)] transition-colors"
                                : ""
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                    {renderExpanded && expandedRowId === row.original.id && (
                      <tr key={`${row.id}-expanded`}>
                        <td colSpan={columns.length} className="p-0">
                          {renderExpanded(row.original)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-text-muted">
                    {t("table.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
          <div className="text-xs text-secondary">{t("table.showing", { start, end, total })}</div>
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 border border-border rounded-md text-text-muted hover:bg-surface hover:text-text disabled:opacity-40 transition-colors cursor-pointer"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 border border-border rounded-md text-text-muted hover:bg-surface hover:text-text disabled:opacity-40 transition-colors cursor-pointer"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}