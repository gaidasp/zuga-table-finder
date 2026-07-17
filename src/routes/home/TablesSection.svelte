<script lang="ts">
  import type { AuthUser, Table } from '$lib/types';
  import { getGameWeightColorVar } from '$lib/utils/tableWeight';
  import TableCard from './TableCard.svelte';

  let {
    tables = [],
    authUser = null as AuthUser | null,
    baseZIndex = 0,
    canMutate = false,
    focusedTableId = null,
    onAddPlayer,
    onSavePlayer,
    onDeleteTable,
    onEditTable,
    onMoveTable,
    onExpandTable,
    onDeletePlayer,
    onOpenDetailPlayer
  } = $props();

  let carouselEl = $state<HTMLDivElement | null>(null);
  let activeTableId = $state<string | null>(null);
  let syncRaf = 0;

  const orderedTables = $derived([...tables]);

  function syncActiveFromScroll() {
    if (!carouselEl || orderedTables.length === 0) return;

    const containerRect = carouselEl.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < orderedTables.length; index += 1) {
      const element = document.getElementById(`table-${index}`);
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }

    if (closestIndex !== -1) {
      activeTableId = orderedTables[closestIndex]?.id ?? null;
    }
  }

  function handleCarouselScroll() {
    if (syncRaf) cancelAnimationFrame(syncRaf);
    syncRaf = requestAnimationFrame(() => {
      syncActiveFromScroll();
      syncRaf = 0;
    });
  }

  function scrollToIndex(index: number) {
    requestAnimationFrame(() => {
      const element = document.getElementById(`table-${index}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  $effect(() => {
    if (focusedTableId && tables.length > 3) {
      activeTableId = focusedTableId;
      const index = orderedTables.findIndex(t => t.id === focusedTableId);
      if (index !== -1) {
        // Double RAF to ensure DOM is fully updated after data reload
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToIndex(index);
          });
        });
      }
    }
  });

  $effect(() => {
    if (tables.length <= 3) {
      activeTableId = focusedTableId;
      return;
    }

    if (focusedTableId && orderedTables.some(table => table.id === focusedTableId)) {
      activeTableId = focusedTableId;
      return;
    }

    if (!activeTableId || !orderedTables.some(table => table.id === activeTableId)) {
      activeTableId = orderedTables[0]?.id ?? null;
    }
  });

  $effect(() => {
    if (!carouselEl || tables.length <= 3) return;

    requestAnimationFrame(() => {
      syncActiveFromScroll();
    });

    return () => {
      if (syncRaf) {
        cancelAnimationFrame(syncRaf);
        syncRaf = 0;
      }
    };
  });
</script>

<section aria-labelledby="tables-heading">
  <article class="card card-border" style={`z-index:${baseZIndex}`}>
    <div class="card-body gap-2 sm:gap-4 p-4 sm:p-6">
      <header class="flex items-center justify-between">
        <div>
          <h2 id="tables-heading" class="card-title">Tavoli attivi</h2>
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
      {:else if tables.length <= 3}
        <div class="grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {#each orderedTables as table, index (table.id)}
            <TableCard
              {baseZIndex}
              {canMutate}
              {authUser}
              {table}
              tableIndex={index}
              tableCount={orderedTables.length}
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
      {:else}
        <div
          class="carousel carousel-center w-full space-x-2 px-4 pt-1 pb-1"
          bind:this={carouselEl}
          onscroll={handleCarouselScroll}
        >
          {#each orderedTables as table, index (table.id)}
            <div
              id="table-{index}"
              class="carousel-item w-[80vw] xl:w-[30vw] lg:w-[30vw]"
              data-carousel-item={table.id === activeTableId ? 'active' : undefined}
            >
              <TableCard
                {baseZIndex}
                {canMutate}
                {authUser}
                {table}
                tableIndex={index}
                tableCount={orderedTables.length}
                {onAddPlayer}
                {onSavePlayer}
                {onDeleteTable}
                {onEditTable}
                {onMoveTable}
                {onExpandTable}
                {onDeletePlayer}
                {onOpenDetailPlayer}
              />
            </div>
          {/each}
        </div>
        <div class="flex flex-wrap justify-center w-full pt-0 pb-1 gap-2">
          {#each orderedTables as table, index (table.id)}
            <a
              href="#table-{index}"
              onclick={e => {
                e.preventDefault();
                activeTableId = table.id;
                scrollToIndex(index);
              }}
              class={`btn btn-xs btn-outline transition-all ${table.players.length === table.seats ? 'table-full-striped-indicator' : ''} ${table.id === activeTableId ? 'ring-2 ring-offset-2 ring-offset-base-100 outline outline-2 scale-110' : ''}`}
              style={`color: var(${getGameWeightColorVar(table.weight)}); border-color: var(${getGameWeightColorVar(table.weight)}); outline-color: var(${getGameWeightColorVar(table.weight)}); --tw-ring-color: var(${getGameWeightColorVar(table.weight)});`}
              aria-label="Vai al tavolo {index + 1}"
            >
              <span>{index + 1}</span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </article>
</section>
