<script lang="ts">
    import BarScrollable from "./BarScrollable.svelte"
    import StackedArea from "./StackedArea.svelte"
    import GraphTypeSelector from "./GraphTypeSelector.svelte"
    import { i18n } from "./i18n"
    import { binSize, scroll } from "./stores"
    import type { BarChart } from "./bar"

    // Bar-mode data + forwarding props.
    export let bar_data: BarChart
    export let bins = 30
    export let limit = -1
    export let search: undefined | ((i: number, width: number) => void) = undefined

    // Area-mode data. Each entry is a per-day series over the full history.
    export let series: number[][]
    export let labels: string[] = []
    export let colours: string[] = []

    let mode = "bars"
</script>

<GraphTypeSelector>
    <label>
        <input type="radio" value="bars" bind:group={mode} />
        {i18n("bars")}
    </label>
    <label>
        <input type="radio" value="area" bind:group={mode} />
        {i18n("area")}
    </label>
</GraphTypeSelector>

{#if mode === "bars"}
    <BarScrollable
        data={bar_data}
        {bins}
        bind:binSize={$binSize}
        bind:offset={$scroll}
        {limit}
        {search}
    />
{:else}
    <StackedArea {series} {labels} {colours} />
{/if}
