<script lang="ts">
  import type { AuthUser } from '$lib/types';
  import TableCard from './TableCard.svelte';

  let {
    tables = [],
    authUser = null as AuthUser | null,
    baseZIndex = 0,
    viewOrientation = 'vertical',
    canMutate = false,
    onAddPlayer,
    onSavePlayer,
    onDeleteTable,
    onEditTable,
    onMoveTable,
    onExpandTable,
    onDeletePlayer,
    onOpenDetailPlayer
  } = $props();

  const orderedTables = $derived([...tables]);
</script>

<section aria-labelledby="tables-vertical-heading">
  <article class="card {viewOrientation === 'vertical' ?  'card-border' : ''}" style={`z-index:${baseZIndex}`}>
    <div class="card-body gap-2 sm:gap-4 p-4 sm:p-6">
      <header class="flex items-center justify-between">
        <div>
          <h2 id="tables-vertical-heading" class="card-title">Tavoli attivi</h2>
          <p class="text-sm">Clicca sul titolo per vedere i dettagli.</p>
        </div>
        <span class="badge badge-outline"
          >{tables.length}
          <svg class="h-4/5" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
            <path d="M25.484,7.114l-4.278-3.917C21.034,3.069,20.825,3,20.61,3H5.38C5.165,3,4.956,3.069,4.783,3.197l-4.38,4C0.403,7.197,0,7.453,0,8v2c0,0.551,0.449,1,1,1h24c0.551,0,1-0.449,1-1V8C26,7.469,25.484,7.114,25.484,7.114z"/>
            <path d="M2,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H2z"/>
            <path d="M23,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H23z"/>
            <path d="M20,18c-0.551,0-1-0.449-1-1v-5h2v5C21,17.551,20.551,18,20,18L20,18z"/>
            <path d="M6,18c-0.551,0-1-0.449-1-1v-5h2v5C7,17.551,6.551,18,6,18L6,18z"/>
          </svg></span
        >
      </header>

      {#if tables.length === 0}
        <div class="card card-border">
          <div class="card-body">
            <p>Nessun tavolo aperto: aprine uno e fai partire la serata!</p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-3 sm:gap-4 items-start">
          {#each orderedTables as table, index (table.id)}
            <TableCard
              {baseZIndex}
              {canMutate}
              {authUser}
              {table}
              tableIndex={index}
              tableCount={orderedTables.length}
              moveOrientation="vertical"
              {onAddPlayer}
              {onSavePlayer}
              {onDeleteTable}
              {onEditTable}
              {onMoveTable}
              {onExpandTable}
              {onDeletePlayer}
              {onOpenDetailPlayer}
            />
          {/each}
        </div>
      {/if}
    </div>
  </article>
</section>
