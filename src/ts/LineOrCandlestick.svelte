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
    import { binSize, lineEnd, lineStart, scroll, searchLimit } from "./stores"
    import type { TrendLine } from "./trend"

    let type = "total"
    export let data: number[]
    export let label = "value"
    export let up_colour = CANDLESTICK_GREEN
    export let down_colour = CANDLESTICK_RED
    export let cumulative = false

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

    $: total_end_index = $lineEnd > 0 ? processed_data.length - $lineEnd : processed_data.length
    $: total_start_index =
        $lineStart > 0 ? Math.max(0, processed_data.length - $lineStart) : 0
    $: total_data = processed_data.slice(total_start_index, total_end_index)

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
        <label>
            {i18n("start")}
            <input type="number" bind:value={$lineStart} />
        </label>
        <label>
            {i18n("end")}
            <input type="number" bind:value={$lineEnd} />
        </label>
    </div>
    <LineGraph data={total_data} {label} dayOffset={total_start_index} />
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
        display: grid;
        grid-template-columns: auto 1fr auto 1fr;
        grid-template-areas: "a a b b";
        gap: 0.5em;
        align-items: baseline;
    }

    div.options label {
        display: contents;
    }

    div.options input {
        min-width: 5em;
    }
</style>
