<script lang="ts">
  import type { PageData } from './$types';
  import { deserialize } from '$app/forms';
  import TablesSection from '$lib/components/TablesSection.svelte';
  import PlayerMatchingSection from '$lib/components/PlayerMatchingSection.svelte';
  import FabMenu from '$lib/components/FabMenu.svelte';
  import CreateTableModal from '$lib/components/modals/CreateTableModal.svelte';
  import AddSparePlayerModal from '$lib/components/modals/AddSparePlayerModal.svelte';
  import EditTableModal from '$lib/components/modals/EditTableModal.svelte';
  import AddPlayerModal from '$lib/components/modals/AddPlayerModal.svelte';
  import DeleteTableModal from '$lib/components/modals/DeleteTableModal.svelte';
  import DeletePlayerModal from '$lib/components/modals/DeletePlayerModal.svelte';
  import DetailTableModal from '$lib/components/modals/DetailTableModal.svelte';
  import DetailPlayerModal from '$lib/components/modals/DetailPlayerModal.svelte';
  import EditPlayerModal from '$lib/components/modals/EditPlayerModal.svelte';
  import NightDatePicker from '$lib/components/NightDatePicker.svelte';
  import { getDefaultNightDate } from '$lib/utils/date';
  import { PageStateManager } from '$lib/state/PageStateManager.svelte';
  import { ActionsManager } from '$lib/state/ActionsManager.svelte';

  const honeypotName = 'website';
  const props = $props<{ data: PageData }>();
  
  let pageData = $state(props.data);

  // Initialize state manager
  const stateManager = new PageStateManager(props.data.nightDate ?? getDefaultNightDate());

  $effect(() => {
    pageData = props.data;
    stateManager.updateNightDate(props.data.nightDate ?? getDefaultNightDate());
  });
  
  // Data reload function
  const reloadData = async (updatedDate: string) => {
    const form = new FormData();
    form.set('nightDate', updatedDate);
    const res = await fetch('?/pageData', {
      method: 'POST',
      headers: { accept: 'application/json' },
      body: form
    });
    if (res.ok) {
      const result = deserialize(await res.text());
      if (result?.type === 'success' && result.data) {
        const nextData = result.data as PageData;
        pageData = nextData;
        stateManager.updateNightDate(nextData.nightDate);
      }
    }
  };

  // Initialize actions manager
  const actions = new ActionsManager(stateManager, reloadData);

  // Derived states
  const selectedTableDetails = $derived(
    stateManager.detailTableModal.tableId
      ? pageData.tables.find((table) => table.id === stateManager.detailTableModal.tableId) ?? null
      : null
  );

  const detailPlayerTable = $derived(
    stateManager.detailPlayerModal.data
      ? pageData.tables.find((table) => table.id === stateManager.detailPlayerModal.data!.tableId) ?? null
      : null
  );

  const editPlayerTable = $derived(
    stateManager.editPlayerModal.data
      ? pageData.tables.find((table) => table.id === stateManager.editPlayerModal.data!.tableId) ?? null
      : null
  );
</script>

<main class="w-full min-h-screen bg-base-200 space-y-4 sm:space-y-8 px-2 py-4 sm:px-4 sm:py-8 overflow-x-hidden">
  <header class="border-b border-base-300 bg-base-200">

    <div class="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <div class="flex items-center gap-4">
        <div class="avatar">
          <div class="max-w-xs max-h-16 rounded overflow-hidden flex items-center justify-center">
            <img
              src="/assets/images/logo.png"
              alt="Logo Zuga"
              class="object-contain w-full h-full"
            />
          </div>
        </div>
        <div class="space-y-1">
          <!-- <span class="badge badge-secondary">Zuga Table Finder</span> -->
          <h1 class="card-title text-3xl">Trova un tavolo per giocare!</h1>
        </div>
      </div>
      <NightDatePicker
        zIndex={stateManager.baseZIndex + 1}
        nightDate={stateManager.nightDate}
        {honeypotName}
        selected={(date) => {
          stateManager.updateNightDate(date);
          void actions.handleNightDateSelected(date);
        }}
      />
    </div>
  </header>

  <div class="grid gap-3 sm:gap-6 grid-cols-1">
    <TablesSection
      tables={pageData.tables}
      baseZIndex={stateManager.baseZIndex}
      focusedTableId={stateManager.focusedTableId}
      onAddPlayer={stateManager.addPlayerModal.open}
      onSavePlayer={(tableId, player) => actions.handleSavePlayer(tableId, player, stateManager.nightDate)}
      onDeleteTable={stateManager.deleteTableModal.open}
      onEditTable={stateManager.editTableModal.open}
      onExpandTable={stateManager.detailTableModal.open}
      onDeletePlayer={stateManager.deletePlayerModal.open}
      onOpenDetailPlayer={stateManager.editPlayerModal.open}
    />
    <PlayerMatchingSection
      weights={pageData.weights}
      sparePlayers={pageData.sparePlayers}
      baseZIndex={stateManager.baseZIndex}
      {honeypotName}
      nightDate={stateManager.nightDate}
      reload={() => reloadData(stateManager.nightDate)}
    />
  </div>
</main>

<FabMenu
  open={stateManager.fabMenu.isOpen}
  zIndex={stateManager.baseZIndex + 1}
  onToggle={stateManager.fabMenu.toggle}
  onCreate={() => {
    stateManager.fabMenu.close();
    stateManager.createTableModal.open();
  }}
  onSpare={() => {
    stateManager.fabMenu.close();
    stateManager.addSparePlayerModal.open();
  }}
/>

<AddSparePlayerModal
  open={stateManager.addSparePlayerModal.isOpen}
  zIndex={stateManager.baseZIndex + 2}
  {honeypotName}
  weights={pageData.weights}
  nightDate={stateManager.nightDate}
  close={stateManager.addSparePlayerModal.close}
  added={(sparePlayer) => actions.handleSpareAdded(sparePlayer, stateManager.nightDate)}
/>

<!-- TABLE MODALS -->

<CreateTableModal
  open={stateManager.createTableModal.isOpen}
  zIndex={stateManager.baseZIndex + 2}
  nightDate={stateManager.nightDate}
  {honeypotName}
  weights={pageData.weights}
  close={stateManager.createTableModal.close}
  created={(table) => actions.handleTableCreated(table, stateManager.nightDate)}
/>

<EditTableModal
  open={stateManager.editTableModal.isOpen}
  zIndex={stateManager.editTableModal.zIndex + 2}
  {honeypotName}
  weights={pageData.weights}
  tableId={stateManager.editTableModal.table?.id ?? null}
  bind:defaultTitle={stateManager.editTableModal.defaultTitle}
  bind:defaultDescription={stateManager.editTableModal.defaultDescription}
  bind:defaultSeats={stateManager.editTableModal.defaultSeats}
  bind:defaultWeight={stateManager.editTableModal.defaultWeight}
  close={stateManager.editTableModal.close}
  saved={(table) => actions.handleTableSaved(table, stateManager.nightDate)}
  onDelete={() => {
    if (stateManager.editTableModal.table) {
      stateManager.editTableModal.close();
      stateManager.deleteTableModal.open(stateManager.editTableModal.table, stateManager.baseZIndex);
    }
  }}
/>

<DeleteTableModal
  open={stateManager.deleteTableModal.isOpen}
  zIndex={stateManager.deleteTableModal.zIndex + 2}
  {honeypotName}
  table={stateManager.deleteTableModal.table}
  close={stateManager.deleteTableModal.close}
  deleted={(tableId) => actions.handleTableDeleted(tableId, stateManager.nightDate)}
/>

<DetailTableModal
  open={!!selectedTableDetails}
  zIndex={stateManager.baseZIndex + 2}
  table={selectedTableDetails}
  close={stateManager.detailTableModal.close}
  onAddPlayer={stateManager.addPlayerModal.open}
  onDeleteTable={stateManager.deleteTableModal.open}
  onEditTable={stateManager.editTableModal.open}
  onDeletePlayer={stateManager.deletePlayerModal.open}
  onOpenDetailPlayer={stateManager.editPlayerModal.open}
/>

<!-- PLAYER MODALS -->

<AddPlayerModal
  open={stateManager.addPlayerModal.isOpen}
  zIndex={stateManager.baseZIndex + 2}
  {honeypotName}
  table={stateManager.addPlayerModal.table}
  close={stateManager.addPlayerModal.close}
  added={(table) => actions.handlePlayerAdded(table, stateManager.nightDate)}
/>

<DeletePlayerModal
  open={stateManager.deletePlayerModal.isOpen}
  zIndex={stateManager.baseZIndex + 2}
  {honeypotName}
  player={stateManager.deletePlayerModal.player}
  close={stateManager.deletePlayerModal.close}
  deleted={(table) => actions.handlePlayerDeleted(table, stateManager.nightDate)}
/>

{#if stateManager.detailPlayerModal.data && detailPlayerTable}
  <DetailPlayerModal
    player={stateManager.detailPlayerModal.data.player}
    open={true}
    zIndex={stateManager.baseZIndex + 2}
    players={detailPlayerTable.players}
    tableId={stateManager.detailPlayerModal.data.tableId}
    close={stateManager.detailPlayerModal.close}
    saved={(player) => actions.handleSavePlayer(stateManager.detailPlayerModal.data!.tableId, player, stateManager.nightDate)}
    deleted={actions.handleDetailPlayerDeleted}
  />
{/if}

{#if stateManager.editPlayerModal.data && editPlayerTable}
  <EditPlayerModal
    bind:player={stateManager.editPlayerModal.data.player}
    open={true}
    zIndex={stateManager.baseZIndex + 2}
    players={editPlayerTable.players}
    tableId={stateManager.editPlayerModal.data.tableId}
    honeypotName={honeypotName}
    close={stateManager.editPlayerModal.close}
    saved={(player) => actions.handleSavePlayer(stateManager.editPlayerModal.data!.tableId, player, stateManager.nightDate)}
    onDelete={() => {
      if (stateManager.editPlayerModal.data) {
        const { tableId, player } = stateManager.editPlayerModal.data;
        stateManager.editPlayerModal.close();
        stateManager.deletePlayerModal.open(tableId, player.id, player.name);
      }
    }}
  />
{/if}
