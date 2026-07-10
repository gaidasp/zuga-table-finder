<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Player } from '$lib/types';
  import { X, TrashIcon } from 'phosphor-svelte';

  let {
    player = $bindable<Player | null>(null),
    open = false,
    zIndex = 0,
    players = [] as Player[],
    tableId = null,
    honeypotName,
    close,
    saved,
    onDelete
  } = $props() 

  let errorMsg = $state('');
  $effect(() => {
    if (open) errorMsg = '';
  });

  
  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      if (!result) return;
      if (result.type === 'success') {
        const data = result.data as any;
        errorMsg = '';
        if (data?.table) {
          const updatedPlayer = data.table.players?.find((p: Player) => p.id === player.id);
          if (updatedPlayer) {
            saved(updatedPlayer);
          }
        }
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message ?? 'Errore durante la modifica del giocatore.';
        await update?.({ reset: false });
        return;
      }
    };
  };

  const handleDialogClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const handleCancel = () => {
    close();
  };
  
</script>

{#if open}
  <dialog 
    class="modal modal-open items-start sm:items-center" 
    tabindex="-1" 
    aria-modal="true" 
    style={`z-index:${zIndex}`}
    open
    onclick={handleDialogClick}
    oncancel={handleCancel}
  >
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base">Modifica un giocatore</h3>
          <button class="btn btn-sm btn-ghost shrink-0" aria-label="Chiudi" onclick={close}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <form method="POST" action="?/updatePlayer" use:enhance={enhanceHandler}>
        <div class="card-body gap-4">
          {#if honeypotName}
            <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          {/if}
          {#if errorMsg}
            <div class="alert alert-error alert-soft text-sm">
              <span>{errorMsg}</span>
            </div>
          {/if}
          <input type="hidden" name="tableId" value={tableId ?? ''} />
          <input type="hidden" name="playerId" value={player.id} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="player-name-readonly">
              <span class="label-text">Nickname (dal profilo utente)</span>
            </label>
            <input
              id="player-name-readonly"
              class="input"
              value={player.name}
              disabled
            />
            <p class="text-xs opacity-70">Il nickname si modifica dal profilo, non dalla lista tavolo.</p>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-beginner">
              <input
                id="add-player-is-beginner"
                name="isBeginner"
                type="checkbox"
                class="checkbox"
                bind:checked={player.isBeginner}
              />
              <span>Richiede spiegazione?</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-teacher">
              <input
                id="add-player-is-teacher"
                name="isTeacher"
                bind:checked={player.isTeacher}
                type="checkbox"
                class="checkbox"
              />
              <span>Spiegatore</span>
            </label>
          </div>
          <div class="flex items-center justify-between gap-2">
            <button type="button" class="btn btn-error" onclick={onDelete}>
              <TrashIcon size={16} weight="bold" aria-hidden="true" />
              Elimina
            </button>
            <button class="btn btn-success" type="submit">Salva</button>
          </div>
        </div>
      </form>
    </div>
    <button
      type="button"
      class="modal-backdrop"
      aria-label="Chiudi"
      onclick={close}
    ></button>
  </dialog>
{/if}
