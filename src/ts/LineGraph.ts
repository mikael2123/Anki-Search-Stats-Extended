import * as d3 from "d3"
import { clearChart, defaultGraphBounds } from "./graph"
import { i18n } from "./i18n"
import { day_ms } from "./revlogGraphs"
import { tooltip, tooltipShown } from "./stores"
import { tooltipX } from "./tooltip"

export function gridLines(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    xTicks: number[],
    yTicks: number[]
) {
    const { width, height } = defaultGraphBounds()

    svg.append("g")
        .selectAll("line")
        .data(xTicks)
        .join("line")
        .attr("x1", (d) => d)
        .attr("x2", (d) => d)
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "currentColor")
        .style("opacity", 0.05)

    svg.append("g")
        .selectAll("line")
        .data(yTicks)
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d) => d)
        .attr("y2", (d) => d)
        .attr("stroke", "currentColor")
        .style("opacity", 0.05)
}

export function renderLineChart(
    svg: SVGElement,
    values: number[],
    label = "Value",
    dayOffset = 0,
    xMode: "date" | "index" = "date"
) {
    if (!svg) {
        return
    }
    // This is a hacky fix and I should probably fix the d3 calls below instead
    clearChart(svg)
    const { width, height } = defaultGraphBounds()

    const isIndex = xMode === "index"

    type Point = { value: number; xv: number }

    const first_non_zero_index = values.findIndex((v) => v)
    const start_index = first_non_zero_index === -1 ? 0 : first_non_zero_index

    // xv is a generic x-domain value: a day number (date mode) or a 0-based
    // card index (index mode).
    const points: Point[] = Array.from(values)
        .slice(start_index)
        .map((v, i) => ({
            value: v ?? 0,
            xv: dayOffset + start_index + i,
        }))

    const toDate = (xv: number) => new Date(xv * day_ms)

    const xMinN = d3.min(points, (d) => d.xv) ?? 0
    const xMaxN = d3.max(points, (d) => d.xv) ?? 0

    const x: any = isIndex
        ? d3.scaleLinear().domain([xMinN, xMaxN]).range([0, width])
        : d3
              .scaleTime()
              .domain([toDate(xMinN), toDate(xMaxN)])
              .range([0, width])

    // Pixel position for a point (index mode uses the raw number, date mode a Date).
    const xPix = (d: Point) => x(isIndex ? d.xv : toDate(d.xv))

    const yMax = d3.max(points, (d) => d.value) ?? 0
    const yMin = d3.min(points, (d) => d.value) ?? 0

    const y = d3.scaleLinear().domain([yMax, yMin]).range([0, height]).nice()

    const axis = d3
        .select(svg)
        .attr("viewBox", `-40 -10 ${width + 50} ${height + 50}`)
        .append("g")

    gridLines(
        axis,
        x.ticks(7).map((t: any) => x(t)),
        y.ticks().map(y)
    )

    axis.append("g").call(d3.axisLeft(y)).attr("opacity", 0.5)

    const bottomAxis = isIndex
        ? d3
              .axisBottom(x)
              .ticks(7)
              .tickFormat((d: any) => `${+d + 1}`)
        : d3.axisBottom(x).ticks(7)
    axis.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("opacity", 0.5)
        .call(bottomAxis as any)

    d3.select(svg)
        .append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .style("pointer-events", "none")
        .attr(
            "d",
            d3
                .line<Point>()
                .x((d) => xPix(d))
                .y((d) => y(d.value))
        )

    const bar_width = width / points.length + 1
    axis.append("g")
        .selectAll("g")
        .data(points.filter((a) => a))
        .join("rect")
        .attr("class", "hover-bar")
        .attr("height", height)
        .attr("width", (_, i) => (i > 0 ? bar_width : bar_width / 2))
        .attr("x", (d, i) => xPix(d) - (i > 0 ? bar_width / 2 : 0))
        .attr("y", 0)
        .on("mouseover", (e: MouseEvent, d) => {
            const value_string = d.value > 10 ? d.value.toFixed(0) : d.value.toPrecision(2)
            const x_string = isIndex
                ? i18n("card-number", { number: d.xv + 1 })
                : toDate(d.xv).toLocaleDateString()
            tooltip.set({
                x: tooltipX(e),
                y: e.pageY,
                text: [`${x_string}:`, `${label}: ${value_string}`],
            })
        })

    axis.on("mouseover", () => tooltipShown.set(true)).on("mouseleave", () =>
        tooltipShown.set(false)
    )
}
