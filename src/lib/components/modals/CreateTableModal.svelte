<script lang="ts">
  import { enhance } from '$app/forms';
  import { Confetti, Feather, PuzzlePiece, Skull, X } from 'phosphor-svelte';
  import type { GameWeight, Table, BGGGame } from '$lib/types';
  import GameSearchInput from '$lib/components/GameSearchInput.svelte';

  let {
    open = false,
    zIndex = 0,
    honeypotName = '',
    nightDate = '',
    weights = [] as GameWeight[],
    close,
    created
  } = $props();
  let defaultWeight: GameWeight = $state('Medio (1-2h)');
  let errorMsg = $state('');
  let title = $state('');
  let bggGame = $state<BGGGame | null>(null);

  $effect(() => {
    if (open) errorMsg = '';
  });

  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      errorMsg = '';
      if (!result) return;
      if (result.type === 'success') {
        const data = result.data as any;
        const tableData = data?.table ?? data;
        created(tableData as Table);
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        errorMsg = result.data?.message ?? 'Si è verificato un errore';
        await update?.({ reset: false });
        return;
      }
      // redirect/error/Response: close modal so UI stays in sync
      close();
      await update?.({ reset: false });
    };
  };
</script>

{#if open}
  <dialog
    class="modal modal-open items-start sm:items-center"
    style={`z-index:${zIndex}`}
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base">Apri un nuovo tavolo</h3>
          <button
            class="btn btn-sm btn-ghost shrink-0"
            aria-label="Chiudi"
            onclick={close}
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <form method="POST" action="?/createTable" use:enhance={enhanceHandler}>
        <div class="card-body gap-4">
          {#if errorMsg}
            <div class="alert alert-error alert-soft">
              <span>{errorMsg}</span>
            </div>
          {/if}
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          <input type="hidden" name="nightDate" value={nightDate} />
          <GameSearchInput bind:title bind:bggGame />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="create-table-seats">Posti disponibili (1-30)</label>
            <input
              id="create-table-seats"
              name="seats"
              type="number"
              min="1"
              max="30"
              value="4"
              class="input"
            />
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="create-table-weight">Peso</label>
            <select
              id="create-table-weight"
              name="weight"
              class="select"
              required
              bind:value={defaultWeight}
            >
              {#each weights as weight}
                <option value={weight}>
                  {#if weight === 'Party'}
                    <span class="inline-flex items-center gap-1"
                      ><Confetti
                        size={20}
                        weight="fill"
                        class="inline-block align-middle text-warning"
                      /> Party</span
                    >
                  {:else if weight === 'Leggero (max 45 min)'}
                    <span class="inline-flex items-center gap-1"
                      ><Feather
                        size={20}
                        weight="fill"
                        class="inline-block align-middle text-info"
                      /> Leggero (max 45 min)</span
                    >
                  {:else if weight === 'Medio (1-2h)'}
                    <span class="inline-flex items-center gap-1"
                      ><PuzzlePiece
                        size={20}
                        weight="fill"
                        class="inline-block align-middle text-success"
                      /> Medio (1-2h)</span
                    >
                  {:else if weight === 'Estremo (>2h)'}
                    <span class="inline-flex items-center gap-1"
                      ><Skull
                        size={20}
                        weight="fill"
                        class="inline-block align-middle text-error"
                      /> Estremo (&gt;2h)</span
                    >
                  {:else}
                    {weight}
                  {/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="create-table-description">Descrizione</label>
            <textarea
              id="create-table-description"
              name="description"
              rows="3"
              placeholder="Tema, espansioni, house rules, vibe"
              class="textarea rounded-lg"
            ></textarea>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Crea</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>
{/if}
