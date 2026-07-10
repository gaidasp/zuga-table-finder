<script lang="ts">
  import type { AuthUser, Player, Table } from '$lib/types';
  import { enhance } from '$app/forms';
  import { X } from 'phosphor-svelte';

  let {
    open = false,
    zIndex = 0,
    honeypotName = "",
    table = null,
    authUser = null as AuthUser | null,
    players = [] as Player[],
    close,
    added
  } = $props() 
  
  let errorMsg = $state('');
  let name = $state('');

  const normalizeName = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

  const isCurrentUserAlreadyInTable = (currentTable: Table | null, currentUser: AuthUser | null) => {
    if (!currentTable || !currentUser?.id) return false;
    return currentTable.players.some((player) => player.userId && player.userId === currentUser.id);
  };

  $effect(() => {
    if (open) errorMsg = '';
  });

  $effect(() => {
    if (!open || !table) return;

    const alreadyInTable = isCurrentUserAlreadyInTable(table, authUser);
    if (alreadyInTable) {
      name = '';
      return;
    }

    const nickname = authUser?.nickname?.trim() ?? '';
    name = nickname;
  });

  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      if (!result) return;
      if (result.type === 'success') {
        const data = result.data as any;
        const tableData = data?.table ?? data;
        added(tableData);
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        //close();
        errorMsg = data?.message ?? 'Errore durante l\'aggiunta del giocatore.';
        await update?.({ reset: false });
        return;
      }
      // redirect/error/Response: close modal so UI stays in sync
      close();
      await update?.({ reset: false });
    };
  };

</script>

{#if open && table}
  <dialog class="modal modal-open items-start sm:items-center" aria-modal="true">
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <div class="grow">
            <h3 class="card-title text-base px-2">Aggiungi un giocatore</h3>
            <p class="text-xs opacity-60">Tavolo: {table.title}</p>
          </div>
          <button class="btn btn-sm btn-ghost shrink-0" aria-label="Chiudi" onclick={close}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <form method="POST" action="?/joinTable" use:enhance={enhanceHandler}>
        <div class="card-body gap-4">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          <input type="hidden" name="tableId" value={table.id} />
          <input type="hidden" name="nightDate" value={table.nightDate} />
          {#if errorMsg}
            <div class="alert alert-error alert-soft text-sm">{errorMsg}</div>
          {/if}
          <label class="form-control">
            <span class="label-text mb-1">Nome giocatore</span>
            <input
              name="name"
              class="input input-bordered"
              maxlength="48"
              bind:value={name}
              placeholder={isCurrentUserAlreadyInTable(table, authUser)
                ? 'Inserisci nome giocatore non registrato'
                : 'Di default: il tuo nickname (modificabile)'}
              required
            />
            {#if !isCurrentUserAlreadyInTable(table, authUser)}
              <span class="label-text-alt opacity-70">Puoi lasciare il tuo nickname o inserire un altro giocatore non registrato.</span>
            {:else}
              <span class="label-text-alt opacity-70">Sei gia in questo tavolo: aggiungi un altro giocatore manualmente.</span>
            {/if}
          </label>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-beginner">
              <input
                id="add-player-is-beginner"
                name="isBeginner"
                type="checkbox"
                class="checkbox"
              />
              <span>Richiede spiegazione?</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-teacher">
              <input id="add-player-is-teacher" name="isTeacher" type="checkbox" class="checkbox" />
              <span>Spiegatore</span>
            </label>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Aggiungi</button>
          </div>
        </div>
      </form>
    </div>
    <button class="modal-backdrop" onclick={close} aria-label="Chiudi" type="button"></button>
  </dialog>
{/if}
