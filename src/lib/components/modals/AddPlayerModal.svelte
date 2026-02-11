<script lang="ts">
  import type { Player, Table } from '$lib/types';
  import { enhance } from '$app/forms';
  import { X } from 'phosphor-svelte';

  let {
    open = false,
    zIndex = 0,
    honeypotName = "",
    table = null,
    players = [] as Player[],
    close,
    added
  } = $props() 
  
  let errorMsg = $state('');
  $effect(() => {
    if (open) errorMsg = '';
  });

  const enhanceHandler = ({
    update
  }: {
    update?: (opts?: { reset?: boolean }) => Promise<void>;
  }) => {
    return async ({ result }: any) => {
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
  <dialog class="modal modal-open" aria-modal="true">
    <div class="modal-box">
      <div class="flex items-center justify-between px-3 py-2">
        <h3 class="card-title">Aggiungi un giocatore</h3>
        <button class="btn btn-sm btn-ghost" aria-label="Chiudi dettagli" onclick={close}>
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <p>Tavolo: {table.title}</p>
      <form method="POST" action="?/joinTable" use:enhance={enhanceHandler}>
        <div class="card-body">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          <input type="hidden" name="tableId" value={table.id} />
          <input type="hidden" name="nightDate" value={table.nightDate} />
          {#if errorMsg}
            <div class="alert alert-error alert-soft mb-2 text-sm">{errorMsg}</div>
          {/if}
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="add-player-name">
              <span class="label-text">Nome</span>
            </label>
            <input
              id="add-player-name"
              name="name"
              required
              placeholder="Nickname o nome"
              class="input"
            />
          </div>
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
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Aggiungi</button>
          </div>
        </div>
      </form>
    </div>
    <button class="modal-backdrop" onclick={close} aria-label="Chiudi" type="button"></button>
  </dialog>
{/if}
