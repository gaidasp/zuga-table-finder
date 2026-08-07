<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { CaretDownIcon, CaretUpIcon, CheckIcon, CopyIcon, HouseIcon, PencilSimpleIcon, TrashIcon, XIcon } from 'phosphor-svelte';

  const props = $props<{ data: PageData; form?: ActionData }>();

  let editModalOpen = $state(false);
  let deleteModalOpen = $state(false);
  let selectedUserId = $state('');
  let selectedUserNickname = $state('');
  let selectedUserCode = $state('');
  let selectedUserIsAdmin = $state(false);
  let selectedUserCreatedAt = $state<number | null>(null);
  let copiedUserId = $state<string | null>(null);
  let nicknameSort = $state<'asc' | 'desc'>('asc');

  const generatedCodes = $derived.by(() => (props.form as { generatedCodes?: string[] } | undefined)?.generatedCodes ?? []);
  const feedbackMessage = $derived.by(() => (props.form as { message?: string } | undefined)?.message ?? null);
  const users = $derived.by(() => {
    const source = (props.form as { users?: PageData['users'] } | undefined)?.users ?? props.data.users;
    const direction = nicknameSort === 'asc' ? 1 : -1;

    return [...source].sort((first, second) => {
      const firstNickname = first.nickname?.trim() || first.code;
      const secondNickname = second.nickname?.trim() || second.code;
      return firstNickname.localeCompare(secondNickname, 'it', { sensitivity: 'base' }) * direction;
    });
  });
  const formName = $derived.by(() => (props.form as { form?: string } | undefined)?.form ?? null);
  const adminUsers = $derived(users.filter((user) => user.isAdmin));
  const normalUsers = $derived(users.filter((user) => !user.isAdmin));

  const openEditModal = (user: PageData['users'][number]) => {
    selectedUserId = user.id;
    selectedUserNickname = user.nickname ?? '';
    selectedUserCode = user.code;
    selectedUserIsAdmin = user.isAdmin;
    selectedUserCreatedAt = user.createdAt;
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

  const toggleNicknameSort = () => {
    nicknameSort = nicknameSort === 'asc' ? 'desc' : 'asc';
  };

  const copyUserCredentials = async (userId: string, nickname: string | null, code: string) => {
    try {
      const credentials = `${nickname?.trim() || '-'}\n${code}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(credentials);
      } else {
        const input = document.createElement('textarea');
        input.value = credentials;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      copiedUserId = userId;
      setTimeout(() => {
        if (copiedUserId === userId) copiedUserId = null;
      }, 1500);
    } catch {
      copiedUserId = null;
    }
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
        <a
          class="btn btn-sm btn-square btn-ghost"
          href="/"
          aria-label="Torna alla home"
          title="Torna alla home"
        >
          <HouseIcon size={18} weight="bold" aria-hidden="true" />
        </a>
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

      {#snippet usersTable(userList: PageData['users'])}
        <div class="overflow-x-auto">
          <table class="table table-sm table-fixed w-full">
            <colgroup>
              <col />
              <col style="width: 6.5rem;" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring"
                    aria-label={`Ordina nickname in ordine ${nicknameSort === 'asc' ? 'decrescente' : 'crescente'}`}
                    onclick={toggleNicknameSort}
                  >
                    Nickname
                    {#if nicknameSort === 'asc'}
                      <CaretUpIcon size={14} weight="bold" aria-hidden="true" />
                    {:else}
                      <CaretDownIcon size={14} weight="bold" aria-hidden="true" />
                    {/if}
                  </button>
                </th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {#each userList as user}
                <tr>
                  <td class="break-words">
                    {user.nickname ?? '-'}
                  </td>
                  <td class="whitespace-nowrap">
                    <div class="flex flex-nowrap items-center justify-end gap-1">
                      <button
                        type="button"
                        class="btn btn-xs btn-square btn-ghost shrink-0 p-0"
                        aria-label={`Copia nickname e codice di ${user.nickname ?? user.code}`}
                        title="Copia nickname e codice"
                        onclick={() => copyUserCredentials(user.id, user.nickname, user.code)}
                      >
                        {#if copiedUserId === user.id}
                          <CheckIcon size={14} weight="bold" aria-hidden="true" />
                        {:else}
                          <CopyIcon size={14} weight="bold" aria-hidden="true" />
                        {/if}
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-square btn-ghost p-0"
                        aria-label={`Modifica ${user.nickname ?? user.code}`}
                        onclick={() => openEditModal(user)}
                      >
                        <PencilSimpleIcon size={14} weight="bold" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-xs btn-square btn-ghost btn-error p-0"
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
      {/snippet}

      <section class="collapse collapse-arrow border border-base-300 bg-base-100 hover:border-base-400">
        <input type="checkbox" />
        <div class="collapse-title flex items-center justify-between">
          <h2 class="card-title text-lg">Admin</h2>
          <span class="badge badge-outline">{adminUsers.length}</span>
        </div>
        <div class="collapse-content">
          {#if adminUsers.length === 0}
            <p class="text-sm text-base-content/70">Nessun admin creato.</p>
          {:else}
            {@render usersTable(adminUsers)}
          {/if}
        </div>
      </section>

      <section class="collapse collapse-arrow border border-base-300 bg-base-100 hover:border-base-400">
        <input type="checkbox" />
        <div class="collapse-title flex items-center justify-between">
          <h2 class="card-title text-lg">Utenti normali</h2>
          <span class="badge badge-outline">{normalUsers.length}</span>
        </div>
        <div class="collapse-content">
          {#if normalUsers.length === 0}
            <p class="text-sm text-base-content/70">Nessun utente creato.</p>
          {:else}
            {@render usersTable(normalUsers)}
          {/if}
        </div>
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

          {#if selectedUserCreatedAt}
            <p class="text-sm text-base-content/70">
              Creato il {new Date(selectedUserCreatedAt).toLocaleString('it-IT', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </p>
          {/if}

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
            <label class="label" for="edit-user-code">CODICE</label>
            <input
              id="edit-user-code"
              type="text"
              name="code"
              class="input w-full font-mono"
              maxlength="128"
              minlength="8"
              bind:value={selectedUserCode}
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
