<script lang="ts">
  import type { PageData } from './$types';
  import type { ActionData } from './$types';
  import { deserialize } from '$app/forms';
  import { UserIcon } from 'phosphor-svelte';
  import type { AuthUser, Player, SparePlayer, Table } from '$lib/types';
  import AuthHeader from '../home/AuthHeader.svelte';
  import TablesSection from '../home/TablesSection.svelte';
  import TablesSectionVertical from '../home/TablesSectionVertical.svelte';
  import PlayerMatchingSection from '../home/PlayerMatchingSection.svelte';
  import FabMenu from '../home/FabMenu.svelte';
  import CreateTableModal from '../home/modals/CreateTableModal.svelte';
  import AddSparePlayerModal from '../home/modals/AddSparePlayerModal.svelte';
  import EditTableModal from '../home/modals/EditTableModal.svelte';
  import AddPlayerModal from '../home/modals/AddPlayerModal.svelte';
  import DeleteTableModal from '../home/modals/DeleteTableModal.svelte';
  import DeletePlayerModal from '../home/modals/DeletePlayerModal.svelte';
  import DetailTableModal from '../home/modals/DetailTableModal.svelte';
  import DetailPlayerModal from '../home/modals/DetailPlayerModal.svelte';
  import EditPlayerModal from '../home/modals/EditPlayerModal.svelte';
  import LoginModal from '../home/modals/LoginModal.svelte';
  import NightDatePicker from '../home/NightDatePicker.svelte';
  import { getDefaultNightDate } from '$lib/utils/date';
  import { PageStateManager } from '../home/state/PageStateManager.svelte';
  import { ActionsManager } from '../home/state/ActionsManager.svelte';

  const honeypotName = 'website';
  const props = $props<{ data: PageData; form?: ActionData }>();

  let pageData = $state(props.data);
  let activeTab = $state<'tables' | 'spares'>('tables');
  const actionForm = $derived(props.form ?? null);

  const signInError = $derived(
    actionForm && (actionForm as { form?: string; message?: string }).form === 'signIn'
      ? ((actionForm as { message?: string }).message ?? null)
      : null
  );
  const sharedTableId = $derived((props.data as { sharedTableId?: string | null }).sharedTableId ?? null);
  let lastAppliedSharedTableId = $state<string | null>(null);

  const stateManager = new PageStateManager(
    props.data.nightDate ?? getDefaultNightDate(),
    (props.data as { authUser?: AuthUser | null }).authUser ?? null
  );
  const isAuthenticated = $derived(Boolean(stateManager.authUser));

  $effect(() => {
    pageData = props.data;
    stateManager.updateNightDate(props.data.nightDate ?? getDefaultNightDate());
    stateManager.setAuthUser((props.data as { authUser?: AuthUser | null }).authUser ?? null);
    stateManager.updateData({ tables: props.data.tables, sparePlayers: props.data.sparePlayers });

    if (
      sharedTableId &&
      sharedTableId !== lastAppliedSharedTableId &&
      props.data.tables.some((table: Table) => table.id === sharedTableId)
    ) {
      activeTab = 'tables';
      stateManager.setFocusedTable(sharedTableId);
      stateManager.detailTableModal.open(sharedTableId);
      lastAppliedSharedTableId = sharedTableId;
    }
  });

  $effect(() => {
    if (signInError && !stateManager.authUser) {
      stateManager.loginModal.open();
    }
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
        const nextData = result.data as Partial<PageData>;
        const mergedData = { ...pageData, ...nextData } as PageData;
        pageData = mergedData;
        stateManager.updateNightDate(mergedData.nightDate);
        stateManager.updateData({
          tables: mergedData.tables,
          sparePlayers: mergedData.sparePlayers
        });
      }
    }
  };

  const actions = new ActionsManager(stateManager, reloadData);

  const selectedTableDetails = $derived(
    stateManager.detailTableModal.tableId
      ? pageData.tables.find((table: Table) => table.id === stateManager.detailTableModal.tableId) ?? null
      : null
  );

  const detailPlayerTable = $derived(
    stateManager.detailPlayerModal.data
      ? pageData.tables.find((table: Table) => table.id === stateManager.detailPlayerModal.data!.tableId) ?? null
      : null
  );

  const editPlayerTable = $derived(
    stateManager.editPlayerModal.data
      ? pageData.tables.find((table: Table) => table.id === stateManager.editPlayerModal.data!.tableId) ?? null
      : null
  );

  const canManagePlayer = (player: Player) => {
    const authUser = stateManager.authUser;
    if (!authUser) return false;
    if (authUser.isAdmin) return true;
    return Boolean(
      (player.userId && player.userId === authUser.id) ||
      (player.ownerUserId && player.ownerUserId === authUser.id)
    );
  };

  const handleOpenPlayerDetails = (tableId: string, player: Player) => {
    if (canManagePlayer(player)) {
      stateManager.editPlayerModal.open(tableId, player);
      return;
    }

    stateManager.detailPlayerModal.open(tableId, player);
  };
</script>

<main class="w-full min-h-screen bg-base-200 px-2 py-4 sm:px-4 sm:py-8 overflow-x-hidden">
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
          <h1 class="card-title text-3xl">Trova un tavolo per giocare!</h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <NightDatePicker
          zIndex={stateManager.baseZIndex + 1}
          nightDate={stateManager.nightDate}
          tableNightDates={pageData.tableNightDates}
          {honeypotName}
          selected={(date: string) => {
            stateManager.updateNightDate(date);
            void actions.handleNightDateSelected(date);
          }}
        />
        <AuthHeader authUser={stateManager.authUser ?? null} onOpenLogin={stateManager.loginModal.open} />
      </div>
    </div>
  </header>

  {#if pageData.databaseError}
    <div class="mt-4 sm:mt-8 space-y-4 sm:space-y-6">
      <div class="alert alert-error shadow-sm">
        <span>{pageData.databaseError}</span>
      </div>

      <section class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Modalita offline</h2>
          <p>I dati dei tavoli non sono disponibili finche la connessione al database non viene ripristinata.</p>
        </div>
      </section>
    </div>
  {:else}
    <section class="mt-4 sm:mt-8 space-y-4 sm:space-y-6">
      {#if !isAuthenticated}
        <div class="alert alert-info shadow-sm">
          <span>Puoi vedere i tavoli senza login. Accedi con il tuo codice per aggiungere, modificare o eliminare dati.</span>
        </div>
      {/if}

      <div class="w-full overflow-hidden rounded-box border border-base-300 bg-base-100">
        <div class="grid grid-cols-2 w-full">
          <button
            type="button"
            class={`btn rounded-none h-14 w-full border-none shadow-none m-0 p-0 flex items-center justify-center ${activeTab === 'tables' ? 'btn-primary' : 'btn-ghost'}`}
            aria-label="Apri tab tavoli"
            aria-pressed={activeTab === 'tables'}
            onclick={() => {
              activeTab = 'tables';
            }}
          >
            <svg class="h-6 w-6" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
              <path d="M25.484,7.114l-4.278-3.917C21.034,3.069,20.825,3,20.61,3H5.38C5.165,3,4.956,3.069,4.783,3.197l-4.38,4C0.403,7.197,0,7.453,0,8v2c0,0.551,0.449,1,1,1h24c0.551,0,1-0.449,1-1V8C26,7.469,25.484,7.114,25.484,7.114z"/>
              <path d="M2,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H2z"/>
              <path d="M23,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H23z"/>
              <path d="M20,18c-0.551,0-1-0.449-1-1v-5h2v5C21,17.551,20.551,18,20,18L20,18z"/>
              <path d="M6,18c-0.551,0-1-0.449-1-1v-5h2v5C7,17.551,6.551,18,6,18L6,18z"/>
            </svg>
          </button>
          
          <button
            type="button"
            class={`btn rounded-none h-14 w-full border-none shadow-none m-0 p-0 flex items-center justify-center ${activeTab === 'spares' ? 'btn-primary' : 'btn-ghost'}`}
            aria-label="Apri tab giocatori"
            aria-pressed={activeTab === 'spares'}
            onclick={() => {
              activeTab = 'spares';
            }}
          >
            <UserIcon size={24} weight="bold" aria-hidden="true" />
          </button>
        </div>

      {#if activeTab === 'tables'}
        {#if stateManager.viewOrientation === 'vertical'}
          <TablesSectionVertical
            tables={pageData.tables}
            authUser={stateManager.authUser ?? null}
            canMutate={isAuthenticated}
            baseZIndex={stateManager.baseZIndex}
            viewOrientation={stateManager.viewOrientation}
            onAddPlayer={stateManager.addPlayerModal.open}
            onSavePlayer={(tableId: string, player: Player) => actions.handleSavePlayer(tableId, player, stateManager.nightDate)}
            onDeleteTable={stateManager.deleteTableModal.open}
            onEditTable={stateManager.editTableModal.open}
            onMoveTable={(tableId: string, direction: 'left' | 'right') =>
              actions.handleTableReordered(tableId, direction, stateManager.nightDate)}
            onExpandTable={stateManager.detailTableModal.open}
            onDeletePlayer={stateManager.deletePlayerModal.open}
            onOpenDetailPlayer={handleOpenPlayerDetails}
          />
        {:else}
          <TablesSection
            tables={pageData.tables}
            authUser={stateManager.authUser ?? null}
            canMutate={isAuthenticated}
            baseZIndex={stateManager.baseZIndex}
            focusedTableId={stateManager.focusedTableId}
            onAddPlayer={stateManager.addPlayerModal.open}
            onSavePlayer={(tableId: string, player: Player) => actions.handleSavePlayer(tableId, player, stateManager.nightDate)}
            onDeleteTable={stateManager.deleteTableModal.open}
            onEditTable={stateManager.editTableModal.open}
            onMoveTable={(tableId: string, direction: 'left' | 'right') =>
              actions.handleTableReordered(tableId, direction, stateManager.nightDate)}
            onExpandTable={stateManager.detailTableModal.open}
            onDeletePlayer={stateManager.deletePlayerModal.open}
            onOpenDetailPlayer={handleOpenPlayerDetails}
          />
        {/if}
      {:else}
        <PlayerMatchingSection
          weights={pageData.weights}
          sparePlayers={pageData.sparePlayers}
          authUser={stateManager.authUser ?? null}
          canMutate={isAuthenticated}
          baseZIndex={stateManager.baseZIndex}
          {honeypotName}
          nightDate={stateManager.nightDate}
          reload={() => reloadData(stateManager.nightDate)}
        />
      {/if}
      </div>
    </section>
  {/if}
</main>

{#if !pageData.databaseError && isAuthenticated}
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
    onView={() => {
      stateManager.fabMenu.close();
      const nextOrientation =
        stateManager.viewOrientation === 'vertical' ? 'horizontal' : 'vertical';
      actions.handleViewOrientationChanged(nextOrientation);
    }}
  />

  <AddSparePlayerModal
    open={stateManager.addSparePlayerModal.isOpen}
    zIndex={stateManager.baseZIndex + 2}
    {honeypotName}
    weights={pageData.weights}
    nightDate={stateManager.nightDate}
    close={stateManager.addSparePlayerModal.close}
    added={(sparePlayer: SparePlayer) => actions.handleSpareAdded(sparePlayer, stateManager.nightDate)}
  />

  <CreateTableModal
    open={stateManager.createTableModal.isOpen}
    zIndex={stateManager.baseZIndex + 2}
    nightDate={stateManager.nightDate}
    {honeypotName}
    weights={pageData.weights}
    close={stateManager.createTableModal.close}
    created={(table: Table) => actions.handleTableCreated(table, stateManager.nightDate)}
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
    bind:defaultBggGame={stateManager.editTableModal.defaultBggGame}
    close={stateManager.editTableModal.close}
    saved={(table: Table) => actions.handleTableSaved(table, stateManager.nightDate)}
    onDelete={() => {
      if (stateManager.editTableModal.table) {
        stateManager.deleteTableModal.open(stateManager.editTableModal.table, stateManager.editTableModal.zIndex + 2);
      }
    }}
  />

  <DeleteTableModal
    open={stateManager.deleteTableModal.isOpen}
    zIndex={stateManager.deleteTableModal.zIndex + 2}
    {honeypotName}
    table={stateManager.deleteTableModal.table}
    close={stateManager.deleteTableModal.close}
    deleted={(tableId: string) => actions.handleTableDeleted(tableId, stateManager.nightDate)}
  />

  <AddPlayerModal
    open={stateManager.addPlayerModal.isOpen}
    zIndex={stateManager.baseZIndex + 2}
    {honeypotName}
    table={stateManager.addPlayerModal.table}
    authUser={stateManager.authUser ?? null}
    close={stateManager.addPlayerModal.close}
    added={(table: Table) => actions.handlePlayerAdded(table, stateManager.nightDate)}
  />

  <DeletePlayerModal
    open={stateManager.deletePlayerModal.isOpen}
    zIndex={stateManager.baseZIndex + 2}
    {honeypotName}
    player={stateManager.deletePlayerModal.player}
    close={stateManager.deletePlayerModal.close}
    deleted={(table: Table) => actions.handlePlayerDeleted(table, stateManager.nightDate)}
  />

  {#if stateManager.editPlayerModal.data && editPlayerTable}
    <EditPlayerModal
      bind:player={stateManager.editPlayerModal.data.player}
      open={true}
      zIndex={stateManager.baseZIndex + 2}
      players={editPlayerTable.players}
      tableId={stateManager.editPlayerModal.data.tableId}
      honeypotName={honeypotName}
      close={stateManager.editPlayerModal.close}
      saved={(player: Player) => actions.handleSavePlayer(stateManager.editPlayerModal.data!.tableId, player, stateManager.nightDate)}
      onDelete={() => {
        if (stateManager.editPlayerModal.data) {
          const { tableId, player } = stateManager.editPlayerModal.data;
          stateManager.editPlayerModal.close();
          stateManager.deletePlayerModal.open(tableId, player.id, player.name);
        }
      }}
    />
  {/if}
{/if}

{#if !pageData.databaseError}
  <LoginModal
    open={stateManager.loginModal.isOpen}
    zIndex={stateManager.baseZIndex + 4}
    {honeypotName}
    signInError={signInError}
    close={stateManager.loginModal.close}
  />

  <DetailTableModal
    open={!!selectedTableDetails}
    zIndex={stateManager.baseZIndex + 2}
    canMutate={isAuthenticated}
    authUser={stateManager.authUser ?? null}
    table={selectedTableDetails}
    close={stateManager.detailTableModal.close}
    onAddPlayer={stateManager.addPlayerModal.open}
    onDeleteTable={stateManager.deleteTableModal.open}
    onEditTable={stateManager.editTableModal.open}
    onDeletePlayer={stateManager.deletePlayerModal.open}
    onOpenDetailPlayer={handleOpenPlayerDetails}
  />

  {#if stateManager.detailPlayerModal.data && detailPlayerTable}
    <DetailPlayerModal
      player={stateManager.detailPlayerModal.data.player}
      open={true}
      zIndex={stateManager.baseZIndex + 2}
      canMutate={isAuthenticated}
      authUser={stateManager.authUser ?? null}
      players={detailPlayerTable.players}
      tableId={stateManager.detailPlayerModal.data.tableId}
      close={stateManager.detailPlayerModal.close}
      saved={(player: Player) => actions.handleSavePlayer(stateManager.detailPlayerModal.data!.tableId, player, stateManager.nightDate)}
      deleted={actions.handleDetailPlayerDeleted}
    />
  {/if}
{/if}
