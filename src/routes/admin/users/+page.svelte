<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { PencilSimpleIcon, TrashIcon, XIcon } from 'phosphor-svelte';

  const props = $props<{ data: PageData; form?: ActionData }>();

  let editModalOpen = $state(false);
  let deleteModalOpen = $state(false);
  let selectedUserId = $state('');
  let selectedUserNickname = $state('');
  let selectedUserGuid = $state('');
  let selectedUserIsAdmin = $state(false);

  const generatedCodes = $derived.by(() => (props.form as { generatedCodes?: string[] } | undefined)?.generatedCodes ?? []);
  const feedbackMessage = $derived.by(() => (props.form as { message?: string } | undefined)?.message ?? null);
  const users = $derived.by(() => (props.form as { users?: PageData['users'] } | undefined)?.users ?? props.data.users);
  const formName = $derived.by(() => (props.form as { form?: string } | undefined)?.form ?? null);

  const openEditModal = (user: PageData['users'][number]) => {
    selectedUserId = user.id;
    selectedUserNickname = user.nickname ?? '';
    selectedUserGuid = user.code;
    selectedUserIsAdmin = user.isAdmin;
    editModalOpen = true;
  };

  const openDeleteModal = (user: PageData['users'][number]) => {
    selectedUserId = user.id;
    selectedUserNickname = user.nickname ?? '-';
    deleteModalOpen = true;
  };

  const closeEditModal = () => {
    editModalOpen = false;
  };

  const closeDeleteModal = () => {
    deleteModalOpen = false;
  };

  $effect(() => {
    const isSuccess = Boolean((props.form as { success?: boolean } | undefined)?.success);
    if (!isSuccess) return;
    if (formName === 'editUser') editModalOpen = false;
    if (formName === 'deleteUser') deleteModalOpen = false;
  });
</script>

<main class="min-h-screen bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
  <section class="mx-auto max-w-4xl card bg-base-100 shadow-sm border border-base-300">
    <div class="card-body gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="card-title text-2xl">Gestione utenti</h1>
          <p class="text-sm text-base-content/70">Genera codici di accesso da inviare ai giocatori per il login senza password.</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="/">Torna alla home</a>
      </div>

      <form method="POST" action="?/createUsers" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control w-full">
            <span class="label-text mb-1">Numero codici da creare</span>
            <input
              type="number"
              name="count"
              class="input input-bordered w-full"
              min="1"
              max="30"
              value="1"
            />
          </label>

          <label class="form-control w-full">
            <span class="label-text mb-1">Nickname (solo creazione singola)</span>
            <input
              type="text"
              name="nickname"
              class="input input-bordered w-full"
              maxlength="48"
              placeholder="Opzionale"
            />
          </label>
        </div>

        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" name="makeAdmin" class="checkbox checkbox-sm" />
          <span class="label-text">Crea account admin</span>
        </label>

        <div class="pt-2">
          <button type="submit" class="btn btn-primary">Genera codici</button>
        </div>
      </form>

      {#if feedbackMessage}
        <div class="alert alert-info">
          <span>{feedbackMessage}</span>
        </div>
      {/if}

      {#if generatedCodes.length > 0}
        <section class="card bg-base-200 border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-lg">Codici generati</h2>
            <ul class="list-disc list-inside text-sm break-all">
              {#each generatedCodes as code}
                <li>{code}</li>
              {/each}
            </ul>
          </div>
        </section>
      {/if}

      <section class="space-y-2">
        <h2 class="card-title text-lg">Utenti registrati</h2>
        {#if users.length === 0}
          <p class="text-sm text-base-content/70">Nessun utente creato.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Ruolo</th>
                  <th>Codice</th>
                  <th>Creato il</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {#each users as user}
                  <tr>
                    <td>{user.nickname ?? '-'}</td>
                    <td>{user.isAdmin ? 'Admin' : 'Giocatore'}</td>
                    <td class="font-mono text-xs">{user.code}</td>
                    <td>{new Date(user.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>
                      <div class="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          class="btn btn-xs btn-ghost"
                          aria-label={`Modifica ${user.nickname ?? user.code}`}
                          onclick={() => openEditModal(user)}
                        >
                          <PencilSimpleIcon size={14} weight="bold" />
                        </button>
                        <button
                          type="button"
                          class="btn btn-xs btn-ghost btn-error"
                          aria-label={`Elimina ${user.nickname ?? user.code}`}
                          onclick={() => openDeleteModal(user)}
                        >
                          <TrashIcon size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    </div>
  </section>
</main>

{#if editModalOpen}
  <dialog class="modal modal-open items-start sm:items-center" onclick={(e) => e.target === e.currentTarget && closeEditModal()}>
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base">Modifica utente</h3>
          <button type="button" class="btn btn-sm btn-ghost shrink-0" onclick={closeEditModal} aria-label="Chiudi">
            <XIcon size={18} weight="bold" />
          </button>
        </div>
      </div>

      <form method="POST" action="?/editUser">
        <div class="card-body gap-4">
          <input type="hidden" name="userId" value={selectedUserId} />

          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-user-nickname">Nickname</label>
            <input
              id="edit-user-nickname"
              type="text"
              name="nickname"
              class="input w-full"
              maxlength="48"
              bind:value={selectedUserNickname}
            />
          </div>

          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-user-guid">GUID</label>
            <input
              id="edit-user-guid"
              type="text"
              name="guid"
              class="input w-full font-mono"
              maxlength="128"
              minlength="8"
              bind:value={selectedUserGuid}
              required
            />
          </div>

          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" name="isAdmin" class="checkbox checkbox-sm" bind:checked={selectedUserIsAdmin} />
            <span class="label-text">Utente admin</span>
          </label>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" class="btn btn-ghost" onclick={closeEditModal}>Annulla</button>
            <button type="submit" class="btn btn-primary">Salva</button>
          </div>
        </div>
      </form>
    </div>
    <button type="button" class="modal-backdrop" onclick={closeEditModal} aria-label="Chiudi"></button>
  </dialog>
{/if}

{#if deleteModalOpen}
  <dialog class="modal modal-open" onclick={(e) => e.target === e.currentTarget && closeDeleteModal()}>
    <div class="modal-box max-w-md">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-lg font-semibold">Elimina utente</h3>
        <button type="button" class="btn btn-sm btn-ghost" onclick={closeDeleteModal} aria-label="Chiudi">
          <XIcon size={16} weight="bold" />
        </button>
      </div>

      <p class="mt-3 text-sm text-base-content/80">
        Confermi l'eliminazione dell'utente <span class="font-semibold">{selectedUserNickname}</span>?
      </p>

      <form method="POST" action="?/deleteUser" class="space-y-4 mt-4">
        <input type="hidden" name="userId" value={selectedUserId} />
        <div class="modal-action mt-2">
          <button type="button" class="btn btn-ghost" onclick={closeDeleteModal}>Annulla</button>
          <button type="submit" class="btn btn-error">Elimina</button>
        </div>
      </form>
    </div>
    <button type="button" class="modal-backdrop" onclick={closeDeleteModal} aria-label="Chiudi"></button>
  </dialog>
{/if}
