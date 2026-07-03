<script lang="ts">
    import { renderLineChart } from "./LineGraph"

    let svg: SVGElement | undefined

    export let label: string
    export let data: number[]
    export let dayOffset = 0
    export let xMode: "date" | "index" = "date"

    $: if (svg) {
        renderLineChart(svg, data, label, dayOffset, xMode)
    }
</script>

<svg bind:this={svg}></svg>
