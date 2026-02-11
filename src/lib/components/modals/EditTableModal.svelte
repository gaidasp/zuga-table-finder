<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Table, GameWeight } from '$lib/types';
  import { Confetti, Feather, PuzzlePiece, Skull, X } from 'phosphor-svelte';


  let {
    open = false,
    zIndex = 0,
    honeypotName = "",
    weights = [] as GameWeight[],
    tableId=  null,
    defaultTitle =  $bindable(),
    defaultDescription = $bindable(),   
    defaultSeats =  $bindable(),
    defaultWeight =  $bindable(),
    close,
    saved
  } = $props() 

  let errorMsg = $state('');
  $effect(() => {
    if (open) errorMsg = '';
  });

  const enhanceHandler = ({ update }: { update?: (opts?: { reset?: boolean }) => Promise<void> }) => {
    return async ({ result }: any) => {
      if (!result) return;

      if (result.type === 'success') {
        const data = result.data as any;
        errorMsg = '';
        const tableData = data?.table ?? data;
        if (tableData) {
          saved(tableData as Table);
        }
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message ?? 'Errore durante la modifica del tavolo.';
        await update?.({ reset: false });
        return;
      }
    };
  };
</script>

{#if open}
  <dialog class="modal modal-open" style={`z-index:${zIndex}`} onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div class="modal-box">
      <div class="flex items-center justify-between px-3 py-2">
        <h3 class="card-title">Modifica tavolo</h3>
        <button class="btn btn-sm btn-ghost" aria-label="Chiudi dettagli" onclick={close}>
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <form method="POST" action="?/updateTable" use:enhance={enhanceHandler}>
        <div class="card-body">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          {#if errorMsg}
            <div class="alert alert-error alert-soft mb-2 text-sm">
              <span>{errorMsg}</span>
            </div>
          {/if}
          <input type="hidden" name="tableId" value={tableId ?? ''} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-title">Titolo del tavolo</label>
            <input id="edit-table-title" name="title" required class="input" bind:value={defaultTitle} />
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-seats">Posti disponibili (1-12)</label>
            <input
              id="edit-table-seats"
              name="seats"
              type="number"
              min="1"
              max="30"
              class="input"
              bind:value={defaultSeats} />
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-weight">Peso</label>
            <select id="edit-table-weight" name="weight" class="select" required bind:value={defaultWeight}>
              <option value="" disabled>Scegli il peso</option>
              {#each weights as weight}
                <option value={weight}>
                  {#if weight === 'Party'}
                    <span class="inline-flex items-center gap-1"><Confetti size={20} weight="fill" class="inline-block align-middle text-warning" /> Party</span>
                  {:else if weight === 'Leggero (max 45 min)'}
                    <span class="inline-flex items-center gap-1"><Feather size={20} weight="fill" class="inline-block align-middle text-info" /> Leggero (max 45 min)</span>
                  {:else if weight === 'Medio (1-2h)'}
                    <span class="inline-flex items-center gap-1"><PuzzlePiece size={20} weight="fill" class="inline-block align-middle text-success" /> Medio (1-2h)</span>
                  {:else if weight === 'Estremo (>2h)'}
                    <span class="inline-flex items-center gap-1"><Skull size={20} weight="fill" class="inline-block align-middle text-error" /> Estremo (&gt;2h)</span>
                  {:else}
                    {weight}
                  {/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-description">Descrizione</label>
            <textarea
              id="edit-table-description"
              name="description"
              rows="3"
              class="textarea rounded-lg"
              bind:value={defaultDescription}></textarea>
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Salva</button>
          </div>
        </div>
      </form>
    </div>
    <button type="button" class="modal-backdrop" onclick={close} aria-label="Chiudi"></button>
  </dialog>
{/if}
