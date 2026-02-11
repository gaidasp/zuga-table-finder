<script lang="ts">
  import type { PageData } from './$types';
  import { deserialize } from '$app/forms';
  import type { Player, Table, GameWeight } from '$lib/types';
  import TableCard from '$lib/components/TableCard.svelte';
  import MatchingSection from '$lib/components/MatchingSection.svelte';
  import FabMenu from '$lib/components/FabMenu.svelte';
  import CreateTableModal from '$lib/components/modals/CreateTableModal.svelte';
  import AddSparePlayerModal from '$lib/components/modals/AddSparePlayerModal.svelte';
  import EditTableModal from '$lib/components/modals/EditTableModal.svelte';
  import AddPlayerModal from '$lib/components/modals/AddPlayerModal.svelte';
  import DeleteTableModal from '$lib/components/modals/DeleteTableModal.svelte';
  import DeletePlayerModal from '$lib/components/modals/DeletePlayerModal.svelte';
  import DetailTableModal from '$lib/components/modals/DetailTableModal.svelte';
  import NightDatePicker from '$lib/components/NightDatePicker.svelte';
  import { getDefaultNightDate } from '$lib/utils/date';

  // import {getPageData} from '$server/data';

  const honeypotName = 'website';
  const props = $props<{ data: PageData }>();
  let pageData = $state(props.data);

  $effect(() => {
    pageData = props.data;
  });

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
        pageData = result.data as PageData;
      }
    }
  };
  
  let isFabMenuOpen = $state(false);
  let isCreateTableModalOpen = $state(false);
  let isAddSparePlayerModalOpen = $state(false);

  let tableToAddPlayerTo: { id: string; title: string, nightDate: string } | null = $state(null);
  let tableToDelete: { id: string; title: string } | null = $state(null);
  let playerToDelete: { tableId: string; playerId: string; playerName: string } | null =
    $state(null);
  let tableToEdit: Table | null = $state(null);
  let selectedTableId: string | null = $state(null);

  let defaultTitle = $state('');
  let defaultDescription = $state('');
  let defaultSeats: number | string = $state(4);
  let defaultWeight: GameWeight | '' = $state('');

  let baseZIndex = $state(0);
  let editTableModalZIndex = $state(0);
  let deleteTableModalZIndex = $state(0);


  let nightDate = $state(props.data.nightDate ?? getDefaultNightDate());

  const formatTimestamp = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const openEditTable = (table: Table, currentZIndex: number) => {
    tableToEdit = table;
    defaultTitle = table.title;
    defaultDescription = table.description ?? '';
    defaultSeats = table.seats;
    defaultWeight = table.weight;
    editTableModalZIndex = currentZIndex + 1;
  };

  const handleSavePlayer = async (tableId: string, updated: Player) => {
    if (!updated?.id) return;
    await reloadData(nightDate);
  };

  const handleNightDateSelected = async (updatedDate: string) => {
    nightDate = updatedDate;
    await reloadData(updatedDate);
  };

  const handleAddPlayer = (selectedTable: Table) => {
    tableToAddPlayerTo = { id: selectedTable.id, title: selectedTable.title, nightDate: selectedTable.nightDate };
  };

  const handleDeleteTable = (selectedTable: Table, currentZIndex: number) => {
    tableToDelete = { id: selectedTable.id, title: selectedTable.title };
    deleteTableModalZIndex = currentZIndex + 1;
  };

  const handleExpandTable = (selectedTable: Table) => {
    selectedTableId = selectedTable.id;
  };

  const handleDeletePlayer = (tableId: string, playerId: string, playerName: string) => {
    playerToDelete = { tableId, playerId, playerName };
  };

  const handleToggleFab = () => {
    isFabMenuOpen = !isFabMenuOpen;
  };

  const handleCreateTable = () => {
    isCreateTableModalOpen = true;
    isFabMenuOpen = false;
  };

  const handleAddSpare = () => {
    isAddSparePlayerModalOpen = true;
    isFabMenuOpen = false;
  };

  const handleCloseSpare = () => {
    isAddSparePlayerModalOpen = false;
  };

  const handleSpareAdded = (sparePlayer: any) => {
    if (sparePlayer) {
      void reloadData(nightDate);
    }
    isAddSparePlayerModalOpen = false;
  };

  const handleCloseCreate = () => {
    isCreateTableModalOpen = false;
  };

  const handleTableCreated = (table: any) => {
    if (table) {
      void reloadData(nightDate);
    }
    isCreateTableModalOpen = false;
  };

  const handleCloseEditTable = () => {
    tableToEdit = null;
  };

  const handleTableSaved = (table: any) => {
    void reloadData(nightDate);
    tableToEdit = null;
  };

  const handleCloseDeleteTable = () => {
    tableToDelete = null;
  };

  const handleTableDeleted = (tableId: string) => {
    void reloadData(nightDate);
    tableToDelete = null;
  };

  const handleCloseDetailTable = () => {
    selectedTableId = null;
  };

  const handleDetailAddPlayer = (table: Table) => {
    tableToAddPlayerTo = { id: table.id, title: table.title, nightDate: table.nightDate };
  };

  const handleDetailDeleteTable = (table: Table, currentZIndex: number) => {
    tableToDelete = { id: table.id, title: table.title };
    deleteTableModalZIndex = currentZIndex + 1;
  };

  const handleCloseAddPlayer = () => {
    tableToAddPlayerTo = null;
  };

  const handlePlayerAdded = (updatedTable: any) => {
    void reloadData(nightDate);
    tableToAddPlayerTo = null;
  };

  const handleCloseDeletePlayer = () => {
    playerToDelete = null;
  };

  const handlePlayerDeleted = (updatedTable: any) => {
    void reloadData(nightDate);
    playerToDelete = null;
  };

  const handleReloadData = () => {
    return reloadData(nightDate);
  };

  const selectedTableDetails = $derived(
    selectedTableId ? (pageData.tables.find((table) => table.id === selectedTableId) ?? null) : null
  );
</script>

<main class="w-full min-h-screen space-y-8 px-4 py-8 overflow-x-hidden">
  <header class="border-b border-base-300 bg-base-200/60">

    <div class="flex w-full flex-wrap items-center justify-between gap-4 py-4">
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
        zIndex={baseZIndex + 1}
        {nightDate}
        {honeypotName}
        selected={handleNightDateSelected}
      />
    </div>
  </header>

  <div class="grid gap-6 grid-cols-1">
    <article class="card card-border" style={`z-index:${baseZIndex}`}>
      <div class="card-body gap-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="card-title">Tavoli attivi</h2>
          <p class="text-sm">Clicca sul titolo per vedere i dettagli.</p>
        </div>
        <span class="badge badge-outline"
          >{pageData.tables.length}
          <img src="/assets/icons/board-game.svg" alt="" class="h-4/5" aria-hidden="true" /></span
        >
      </div>

      {#if pageData.tables.length === 0}
        <div class="card card-border">
          <div class="card-body">
            <p>Nessun tavolo aperto: aprine uno e fai partire la serata!</p>
          </div>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {#each [...pageData.tables].sort((a, b) => b.players.length - a.players.length) as table (table.id)}
            <TableCard
              {baseZIndex}
              {table}
              onAddPlayer={handleAddPlayer}
              onSavePlayer={handleSavePlayer}
              onDeleteTable={handleDeleteTable}
              onEditTable={openEditTable}
              onExpandTable={handleExpandTable}
              onDeletePlayer={handleDeletePlayer}
            />
          {/each}
        </div>
      {/if}
        </div>

    </article>
    <aside class="lg:pt-0">
      <MatchingSection
        weights={pageData.weights}
        sparePlayers={pageData.sparePlayers}
        {baseZIndex}
        {honeypotName}
        nightDate={pageData.nightDate}
        reload={handleReloadData}
      />
    </aside>
  </div>
</main>

<FabMenu
  open={isFabMenuOpen}
  zIndex={baseZIndex + 1}
  onToggle={handleToggleFab}
  onCreate={handleCreateTable}
  onSpare={handleAddSpare}
/>

<AddSparePlayerModal
  open={isAddSparePlayerModalOpen}
  zIndex={baseZIndex + 2}
  {honeypotName}
  weights={pageData.weights}
  nightDate={pageData.nightDate}
  close={handleCloseSpare}
  added={handleSpareAdded}
/>

<!-- TABLE MODALS -->

<CreateTableModal
  open={isCreateTableModalOpen}
  zIndex={baseZIndex + 2}
  nightDate={pageData.nightDate}
  {honeypotName}
  weights={pageData.weights}
  close={handleCloseCreate}
  created={handleTableCreated}
/>

<EditTableModal
  open={!!tableToEdit}
  zIndex={editTableModalZIndex + 2}
  {honeypotName}
  weights={pageData.weights}
  tableId={tableToEdit?.id ?? null}
  bind:defaultTitle
  bind:defaultDescription
  bind:defaultSeats
  bind:defaultWeight
  close={handleCloseEditTable}
  saved={handleTableSaved}
/>

<DeleteTableModal
  open={!!tableToDelete}
  zIndex={deleteTableModalZIndex + 2}
  {honeypotName}
  table={tableToDelete}
  close={handleCloseDeleteTable}
  deleted={handleTableDeleted}
/>

<DetailTableModal
  open={!!selectedTableDetails}
  zIndex={baseZIndex + 2}
  table={selectedTableDetails}
  formatDate={formatTimestamp}
  close={handleCloseDetailTable}
  onSavePlayer={handleSavePlayer}
  onAddPlayer={handleDetailAddPlayer}
  onDeleteTable={handleDetailDeleteTable}
  onEditTable={openEditTable}
  onDeletePlayer={handleDeletePlayer}
/>

<!-- PLAYER MODALS -->

<AddPlayerModal
  open={!!tableToAddPlayerTo}
  zIndex={baseZIndex + 2}
  {honeypotName}
  table={tableToAddPlayerTo}
  close={handleCloseAddPlayer}
  added={handlePlayerAdded}
/>

<DeletePlayerModal
  open={!!playerToDelete}
  zIndex={baseZIndex + 2}
  {honeypotName}
  player={playerToDelete}
  close={handleCloseDeletePlayer}
  deleted={handlePlayerDeleted}
/>
