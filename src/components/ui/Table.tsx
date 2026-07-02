import { useState, type ReactNode } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  align?: "left" | "right" | "center";
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  defaultSortKey,
  defaultSortDir = "desc",
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  const sortedData = (() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  })();

  function handleSort(col: TableColumn<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("desc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised/50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3 text-[12px] font-medium uppercase tracking-wide text-text-muted select-none",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.sortValue && "cursor-pointer hover:text-text-secondary"
                )}
                onClick={() => handleSort(col)}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    col.align === "right" && "flex-row-reverse"
                  )}
                >
                  {col.header}
                  {col.sortValue &&
                    (sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3 opacity-40" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border last:border-b-0 transition-colors duration-(--duration-fast)",
                onRowClick && "cursor-pointer hover:bg-surface-hover"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-text-primary",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
