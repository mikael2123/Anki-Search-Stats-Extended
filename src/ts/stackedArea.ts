import * as d3 from "d3"
import { clearChart, defaultGraphBounds } from "./graph"
import { gridLines } from "./LineGraph"
import { day_ms } from "./revlogGraphs"
import { tooltip, tooltipShown } from "./stores"
import { tooltipX } from "./tooltip"

type Row = {
    date: Date
    values: number[]
}

// series: one array per layer, each indexed by day within the visible window.
// dayOffset: absolute day number represented by index 0, used for the date x-axis.
// percent: when true, normalise each day to 100% (d3.stackOffsetExpand) and label the y-axis as %.
export function renderStackedArea(
    svg: SVGElement,
    series: number[][],
    labels: string[],
    colours: string[],
    dayOffset = 0,
    percent = false
) {
    if (!svg) {
        return
    }

    clearChart(svg)
    const { width, height } = defaultGraphBounds()

    const length = Math.max(0, ...series.map((s) => s.length))

    const rows: Row[] = Array.from({ length }, (_, i) => ({
        date: new Date((dayOffset + i) * day_ms),
        values: series.map((s) => s[i] ?? 0),
    }))

    if (rows.length === 0) {
        return
    }

    const keys = series.map((_, i) => i)
    const stack = d3
        .stack<Row, number>()
        .keys(keys)
        .value((row, key) => row.values[key] || 0)
    if (percent) {
        stack.offset(d3.stackOffsetExpand)
    }
    const stacked = stack(rows)

    const xMin = rows[0].date
    const xMax = rows[rows.length - 1].date
    const x = d3.scaleTime().domain([xMin, xMax]).range([0, width])

    const yMax = percent ? 1 : d3.max(stacked[stacked.length - 1], (d) => d[1]) || 0
    const y = d3.scaleLinear().domain([yMax, 0]).range([0, height]).nice()

    const axis = d3
        .select(svg)
        .attr("viewBox", `-40 -10 ${width + 50} ${height + 50}`)
        .append("g")

    gridLines(axis, x.ticks(7).map(x), y.ticks().map(y))

    const yAxis = d3.axisLeft(y)
    if (percent) {
        yAxis.tickFormat(d3.format(".0%"))
    }
    axis.append("g").call(yAxis).attr("opacity", 0.5)

    axis.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("opacity", 0.5)
        .call(d3.axisBottom(x).ticks(7))

    const area = d3
        .area<d3.SeriesPoint<Row>>()
        .x((d) => x(d.data.date))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]))

    axis.append("g")
        .selectAll("path")
        .data(stacked)
        .join("path")
        .attr("fill", (_, i) => colours[i] ?? "steelblue")
        .attr("stroke", "none")
        .style("pointer-events", "none")
        .attr("d", area)

    // Invisible hover columns for tooltips, mirroring LineGraph.
    const bar_width = width / rows.length + 1
    axis.append("g")
        .selectAll("rect")
        .data(rows)
        .join("rect")
        .attr("class", "hover-bar")
        .attr("height", height)
        .attr("width", (_, i) => (i > 0 ? bar_width : bar_width / 2))
        .attr("x", (d, i) => x(d.date)! - (i > 0 ? bar_width / 2 : 0))
        .attr("y", 0)
        .on("mouseover", (e: MouseEvent, d) => {
            const total = d.values.reduce((a, b) => a + b, 0)
            const lines = d.values.map((v, i) => {
                const value_string = percent
                    ? `${((total ? v / total : 0) * 100).toFixed(1)}%`
                    : v > 10
                      ? v.toFixed(0)
                      : v.toPrecision(2)
                return `${labels[i] ?? ""}: ${value_string}`
            })
            tooltip.set({
                x: tooltipX(e),
                y: e.pageY,
                text: [`${d.date.toLocaleDateString()}:`, ...lines],
            })
        })

    axis.on("mouseover", () => tooltipShown.set(true)).on("mouseleave", () =>
        tooltipShown.set(false)
    )
}
