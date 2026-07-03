<script lang="ts">
    import { downloadCsv } from "./csvExport"

    export let filename: string
    export let headers: string[]
    // Lazy: only materialise the (potentially large) rows on click.
    export let rows: () => (string | number)[][]
    export let label = "⬇ CSV"

    async function onClick() {
        await downloadCsv(filename, headers, rows())
    }
</script>

<button class="btn download" title={filename} on:click={onClick}>{label}</button>

<style lang="scss">
    .download {
        margin: 0;
        font-size: small;
        padding: 0.15em 0.5em;
        background-color: #0d6efd;
        cursor: pointer;
        &:hover {
            background-color: #0b5ed7;
            color: var(--bs-button-color);
        }
    }
</style>
