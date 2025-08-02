import { useState, useMemo } from "react";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Select from "../form/Select";

export default function DataTable({
  columns,
  rows,
  title = "",
  actionButton = null,
  entriesOptions = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
  ],
  initialEntries = 10,
  emptyMessage = "No records found.",
  searchPlaceholder = "Search…",
  getRowKey = (row, i) => row.id ?? i,
  onSearch,
  onRowClick,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState(initialEntries);

  // Filtering logic (can be overridden)
  const filteredRows = useMemo(() => {
    let r = rows;
    if (search && search.length > 0) {
      r = r.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    return r;
  }, [search, rows]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / entries));
  const pagedRows = filteredRows.slice((page - 1) * entries, page * entries);

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Reset page when entries or search changes
  // You can add useEffect if you want stricter page reset

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-md p-6 max-w-full mx-auto">
      {/* Toolbar */}
      {(title || actionButton) && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {title && (
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
          )}
          {actionButton}
        </div>
      )}

      {/* Search & Entries */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 dark:text-gray-400">
            Show
          </label>
          <Select
            options={entriesOptions}
            value={entries.toString()}
            onChange={(val) => {
              setEntries(Number(val));
              setPage(1);
            }}
            className="w-16 inline-block"
            menuPosition="fixed"
          />
          <label className="text-sm text-gray-500 dark:text-gray-400">
            entries
          </label>
        </div>
        <Input
          type="text"
          className="w-full sm:w-64"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            onSearch && onSearch(e.target.value);
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full text-sm bg-white dark:bg-gray-900">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              {columns.map((col) => (
                <th key={col.key} className="py-3 px-4 text-left font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, i) => (
                <tr
                  key={getRowKey(row, i)}
                  className="border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td className="py-4 px-4" key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {total === 0 ? 0 : (page - 1) * entries + 1} to{" "}
          {Math.min(page * entries, total)} of {total} entries
        </span>
        <div className="flex gap-1">
          <Button
            className="px-2 py-1 rounded text-xs"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            size="sm"
            variant="outline"
          >
            &larr;
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              className="px-2 py-1 rounded text-xs"
              variant={page === i + 1 ? "primary" : "outline"}
              onClick={() => goToPage(i + 1)}
              size="sm"
            >
              {i + 1}
            </Button>
          ))}
          <Button
            className="px-2 py-1 rounded text-xs"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            size="sm"
            variant="outline"
          >
            &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
