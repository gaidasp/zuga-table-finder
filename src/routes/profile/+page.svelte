<script lang="ts">
  import type { PageData } from './$types';
  import { getAvatarBgClass } from '$lib/utils/avatar';

  const props = $props<{ data: PageData }>();

  const user = $derived.by(() => props.data.user);
  const feedbackMessage = $derived.by(() => props.data.message ?? null);
  const userInitial = $derived.by(() => {
    const first = user.nickname?.trim().charAt(0);
    return (first && first.length > 0 ? first : 'G').toUpperCase();
  });
  const avatarBgClass = $derived.by(() => user.avatarColor ?? getAvatarBgClass(user.id ?? user.nickname));
</script>

<main class="min-h-screen bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
  <section class="mx-auto max-w-2xl card bg-base-100 shadow-sm border border-base-300">
    <div class="border-base-300 border-b border-dashed">
      <div class="flex items-center justify-between gap-2 p-4">
        <div>
          <h1 class="card-title text-2xl">Profilo giocatore</h1>
          <p class="text-sm text-base-content/70">Aggiorna nickname e avatar per comparire nel menu utente.</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="/">Torna alla home</a>
      </div>
    </div>

    <div class="card-body gap-4">

      <div class="flex items-center gap-4">
        {#if user.avatarDataUrl}
          <div class="avatar">
            <div class="h-16 w-16 rounded-full overflow-hidden border border-base-300 aspect-square shrink-0">
              <img src={user.avatarDataUrl} alt="Avatar profilo" class="block h-full w-full object-cover object-center" />
            </div>
          </div>
        {:else}
          <div class="avatar placeholder">
            <div class={`h-16 w-16 rounded-full ${avatarBgClass} text-white grid place-items-center aspect-square shrink-0`}>
              <span class="text-xl font-bold leading-none">{userInitial}</span>
            </div>
          </div>
        {/if}

        <div class="text-sm text-base-content/70">
          <p><span class="font-semibold">Nickname:</span> {user.nickname ?? 'non impostato'}</p>
          <p><span class="font-semibold">Ruolo:</span> {user.isAdmin ? 'Admin' : 'Giocatore'}</p>
        </div>
      </div>

      {#if feedbackMessage}
        <div class="alert alert-info alert-soft text-sm">
          <span>{feedbackMessage}</span>
        </div>
      {/if}

      <form method="POST" action="?/updateProfile" enctype="multipart/form-data">
        <div class="grid gap-4">
        <div class="form-control flex flex-col gap-1">
          <label class="label" for="profile-nickname">Nickname (opzionale)</label>
          <input
            id="profile-nickname"
            type="text"
            name="nickname"
            class="input w-full"
            placeholder="Inserisci un nickname"
            maxlength="48"
            value={user.nickname ?? ''}
          />
        </div>

        <div class="form-control flex flex-col gap-1">
          <label class="label" for="profile-avatar">Foto profilo (opzionale)</label>
          <input id="profile-avatar" type="file" name="avatar" accept="image/png,image/jpeg,image/webp" class="file-input w-full" />
          <span class="label-text-alt">Formati: PNG/JPG/WEBP. Max 1.5MB.</span>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button type="submit" class="btn btn-primary">Salva profilo</button>
          {#if user.avatarDataUrl}
            <button type="submit" formaction="?/removeAvatar" class="btn btn-outline btn-error">Rimuovi avatar</button>
          {/if}
        </div>
        </div>
      </form>
    </div>
  </section>
</main>
