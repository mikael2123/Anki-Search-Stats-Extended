<script lang="ts">
    import { renderLineChart } from "./LineGraph"

    let svg: SVGElement | undefined

    export let label: string
    export let data: number[]
    export let dayOffset = 0

    $: if (svg) {
        renderLineChart(svg, data, label, dayOffset)
    }
</script>

<svg bind:this={svg}></svg>
