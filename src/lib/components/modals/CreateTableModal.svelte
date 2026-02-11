<script lang="ts">
  import { enhance } from '$app/forms';
  import { Confetti, Feather, PuzzlePiece, Skull, X } from 'phosphor-svelte';
  import type { GameWeight, Table } from '$lib/types';

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

  $effect(() => {
    if (open) errorMsg = '';
  });

  const enhanceHandler = ({
    update
  }: {
    update?: (opts?: { reset?: boolean }) => Promise<void>;
  }) => {
    return async ({ result }: any) => {
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
    class="modal modal-open"
    style={`z-index:${zIndex}`}
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="modal-box">
      <button
        class="btn btn-sm btn-ghost absolute right-2 top-2 z-10"
        aria-label="Chiudi"
        onclick={close}
      >
        <X size={18} weight="bold" aria-hidden="true" />
      </button>
      <h3 class="card-title">Apri un nuovo tavolo</h3>
      <form method="POST" action="?/createTable" use:enhance={enhanceHandler}>
        {#if errorMsg}
          <div class="alert alert-error alert-soft mt-2">
            <span>{errorMsg}</span>
          </div>
        {/if}
        <div class="card-body">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          <input type="hidden" name="nightDate" value={nightDate} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="create-table-title">Titolo del tavolo</label>
            <input
              id="create-table-title"
              name="title"
              required
              placeholder="Catan, Azul, party game..."
              class="input"
            />
          </div>
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
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Crea</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>
{/if}
