<script lang="ts">
    import { renderStackedArea } from "./stackedArea"
    import { i18n } from "./i18n"
    import { lineStart, lineEnd } from "./stores"

    export let series: number[][]
    export let labels: string[] = []
    export let colours: string[] = []

    let svg: SVGElement | undefined

    let cumulative = false
    let ratio = false

    function cumulate(data: number[]): number[] {
        let sum = 0
        return data.map((value) => {
            sum += value ?? 0
            return sum
        })
    }

    // Densify (source arrays are sparse) and optionally cumulate from the very
    // beginning, before any windowing, so cumulation always starts at day 0.
    $: full_series = series.map((s) => {
        const dense = Array.from(s ?? [], (v) => v ?? 0)
        return cumulative ? cumulate(dense) : dense
    })

    $: length = Math.max(0, ...full_series.map((s) => s.length))

    // The series are indexed from absolute day 0, so they carry thousands of
    // leading empty days. Like LineGraph, skip to the first day that has data so
    // the x-axis starts at the first review instead of the 1970 epoch.
    $: data_start = (() => {
        let min = Infinity
        for (const s of full_series) {
            const idx = s.findIndex((v) => v)
            if (idx !== -1 && idx < min) min = idx
        }
        return Number.isFinite(min) ? min : 0
    })()

    $: end_index = $lineEnd > 0 ? length - $lineEnd : length
    $: window_start = $lineStart > 0 ? length - $lineStart : 0
    $: start_index = Math.min(Math.max(data_start, window_start, 0), end_index)

    $: windowed_series = full_series.map((s) => s.slice(start_index, end_index))

    $: if (svg) {
        renderStackedArea(svg, windowed_series, labels, colours, start_index, ratio)
    }
</script>

<div class="options">
    <label>
        <span>{i18n("start")}</span>
        <input type="number" bind:value={$lineStart} />
        <span class="unit">{i18n("days-ago")}</span>
    </label>
    <label>
        <span>{i18n("end")}</span>
        <input type="number" bind:value={$lineEnd} />
        <span class="unit">{i18n("days-ago")}</span>
    </label>
</div>

<svg bind:this={svg}></svg>

<div class="toggles">
    <label>
        <input type="checkbox" bind:checked={cumulative} />
        {i18n("cumulative-mode")}
    </label>
    <label>
        <input type="checkbox" bind:checked={ratio} />
        {i18n("as-ratio")}
    </label>
</div>

<style>
    div.options {
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 1.5em;
        margin: 0.5em;
    }

    div.options label {
        display: inline-flex;
        align-items: baseline;
        gap: 0.35em;
        white-space: nowrap;
    }

    div.options input {
        width: 4.5em;
    }

    div.toggles {
        display: flex;
        justify-content: center;
        gap: 1em;
        margin: 0.5em;
    }
</style>
