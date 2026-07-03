<script lang="ts">
    import GraphContainer from "./GraphContainer.svelte"
    import RevlogCalculator from "./RevlogCalculator.svelte"
    import { revlogStats } from "./stores"
</script>

<GraphContainer>
    <div class="corner"><slot name="corner"></slot></div>
    <slot name="title"></slot>
    {#if $revlogStats}
        <slot name="graph"></slot>
    {:else}
        <RevlogCalculator></RevlogCalculator>
    {/if}
    <slot></slot>
</GraphContainer>

<style>
    .corner {
        position: absolute;
        top: 1em;
        right: 1em;
        z-index: 1;
    }
</style>
