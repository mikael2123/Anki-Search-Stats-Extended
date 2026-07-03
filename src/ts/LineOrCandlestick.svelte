<script lang="ts">
    import {
        CANDLESTICK_GREEN,
        CANDLESTICK_RED,
        DeltaIfy,
        type CandlestickGraph,
    } from "./Candlestick"
    import Candlestick from "./Candlestick.svelte"
    import GraphTypeSelector from "./GraphTypeSelector.svelte"
    import { i18n } from "./i18n"
    import LineGraph from "./LineGraph.svelte"
    import { binSize, cardEnd, cardStart, lineEnd, lineStart, scroll, searchLimit } from "./stores"
    import type { TrendLine } from "./trend"

    let type = "total"
    export let data: number[]
    export let label = "value"
    export let up_colour = CANDLESTICK_GREEN
    export let down_colour = CANDLESTICK_RED
    export let cumulative = false
    // "date": x-axis is calendar days (default). "index": x-axis is card order.
    export let xMode: "date" | "index" = "date"

    let bins = 30

    $: limit = -1 - $searchLimit

    function mapIndividualToCumulativeData(data: number[]): number[] {
        let sum = 0
        return data.map((value) => {
            sum += value ?? 0
            return sum
        })
    }

    // Array.from(data) to make sparse array dense
    data = Array.from(data)

    $: processed_data = cumulative ? mapIndividualToCumulativeData(data) : data

    // Date mode: start/end count days back from today. Index mode: absolute
    // 1-based card numbers.
    $: total_start_index =
        xMode === "index"
            ? $cardStart > 0
                ? Math.min($cardStart - 1, processed_data.length)
                : 0
            : $lineStart > 0
              ? Math.max(0, processed_data.length - $lineStart)
              : 0
    $: total_end_index =
        xMode === "index"
            ? $cardEnd > 0
                ? Math.min($cardEnd, processed_data.length)
                : processed_data.length
            : $lineEnd > 0
              ? processed_data.length - $lineEnd
              : processed_data.length
    $: total_data = processed_data.slice(
        total_start_index,
        Math.max(total_start_index, total_end_index)
    )

    let candlestick_data: CandlestickGraph
    $: if (processed_data)
        candlestick_data = {
            start:
                processed_data[processed_data.length - bins * $binSize - Math.abs($scroll) - 1] ||
                0,
            data: Array.from(DeltaIfy(processed_data)).map((delta, i) => ({
                label: i.toString(),
                delta,
            })),
            tick_spacing: 5,
            up_colour,
            down_colour,
            index_labels: xMode === "index",
        }

    export let trend_data: TrendLine
    $: if (type === "total") trend_data = undefined
</script>

<GraphTypeSelector>
    <label>
        <input type="radio" value="total" bind:group={type} />
        {i18n("total")}
    </label>
    <label>
        <input type="radio" value="trend" bind:group={type} />
        {i18n("trend")}
    </label>
</GraphTypeSelector>

{#if type === "total"}
    <div class="options">
        {#if xMode === "index"}
            <label>
                <span>{i18n("start")}</span>
                <input type="number" bind:value={$cardStart} />
                <span class="unit hug">{i18n("th-card")}</span>
            </label>
            <label>
                <span>{i18n("end")}</span>
                <input type="number" bind:value={$cardEnd} />
                <span class="unit hug">{i18n("th-card")}</span>
            </label>
        {:else}
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
        {/if}
    </div>
    <LineGraph data={total_data} {label} dayOffset={total_start_index} {xMode} />
{:else}
    <Candlestick
        data={candlestick_data}
        bind:bins
        bind:binSize={$binSize}
        {limit}
        bind:trend_data
        bind:offset={$scroll}
    />
{/if}

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

    /* Cancel the flex gap so the unit hugs the number, e.g. "500th card". */
    div.options .unit.hug {
        margin-left: -0.35em;
    }
</style>
