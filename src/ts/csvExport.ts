import { day_ms, today } from "./revlogGraphs"
import { saveCsv } from "./search"

type Cell = string | number

function escapeCell(cell: Cell): string {
    const s = String(cell)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: Cell[][]): string {
    return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n")
}

// The stats page runs inside Anki's Qt webview, where a browser-style blob
// download goes nowhere. Instead hand the CSV to the Python side, which opens a
// native "Save As" dialog (see the saveCsv post handler in __init__.py).
export async function downloadCsv(
    filename: string,
    headers: string[],
    rows: Cell[][]
): Promise<void> {
    await saveCsv(filename, toCsv(headers, rows))
}

// Absolute day index -> stable YYYY-MM-DD, matching the tooltipDate day convention.
export function dayIndexToISO(i: number): string {
    return new Date(Date.now() + day_ms * (i - today)).toISOString().slice(0, 10)
}
