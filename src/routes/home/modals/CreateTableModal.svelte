<script lang="ts">
  import { enhance } from '$app/forms';
  import { Confetti, Feather, PuzzlePiece, Skull, X } from 'phosphor-svelte';
  import type { GameWeight, Table, BGGGame } from '$lib/types';
  import GameSearchInput from '../GameSearchInput.svelte';

  let {
    open = false,
    zIndex = 0,
    honeypotName = '',
    nightDate = '',
    weights = [] as GameWeight[],
    close,
    created
  } = $props();

  const DEFAULT_SEATS = 4;
  const DEFAULT_WEIGHT: GameWeight = 'Medio (1-2h)';

  const clampInt = (value: number | undefined, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value as number)));
  };

  const getWeightFromBgg = (game: BGGGame): GameWeight => {
    const time = game.playingTime ?? 0;
    const maxPlayers = game.maxPlayers ?? 0;

    if (time > 0 && time <= 45) {
      return maxPlayers >= 6 ? 'Party' : 'Leggero (max 45 min)';
    }

    if (time > 45 && time <= 120) {
      return maxPlayers >= 7 ? 'Party' : 'Medio (1-2h)';
    }

    if (time > 120) {
      return 'Estremo (>2h)';
    }

    if (maxPlayers >= 7) return 'Party';
    if (maxPlayers >= 5) return 'Leggero (max 45 min)';
    return 'Medio (1-2h)';
  };

  const toDefaultDescription = (game: BGGGame) => (game.description ?? '').trim();

  let defaultWeight: GameWeight = $state('Medio (1-2h)');
  let errorMsg = $state('');
  let title = $state('');
  let defaultDescription = $state('');
  let defaultSeats = $state<number | string>(DEFAULT_SEATS);
  let bggGame = $state<BGGGame | null>(null);
  let lastAutofilledBggId = $state<string | null>(null);

  $effect(() => {
    if (open) errorMsg = '';
  });

  $effect(() => {
    if (!open) return;
    if (!bggGame) {
      if (lastAutofilledBggId !== null) {
        defaultWeight = DEFAULT_WEIGHT;
        defaultDescription = '';
        defaultSeats = DEFAULT_SEATS;
        lastAutofilledBggId = null;
      }
      return;
    }

    if (lastAutofilledBggId === bggGame.id) return;

    defaultWeight = getWeightFromBgg(bggGame);
    defaultDescription = toDefaultDescription(bggGame);
    defaultSeats = clampInt(bggGame.maxPlayers, 1, 30, DEFAULT_SEATS);
    lastAutofilledBggId = bggGame.id;
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
              bind:value={defaultSeats}
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
              bind:value={defaultDescription}
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
