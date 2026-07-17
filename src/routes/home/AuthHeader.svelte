<script lang="ts">
  import type { AuthUser } from '$lib/types';
  import { getAvatarBgClass } from '$lib/utils/avatar';

  let {
    authUser = null as AuthUser | null,
    onOpenLogin = (() => {}) as () => void
  } = $props<{ authUser?: AuthUser | null; onOpenLogin?: () => void }>();

  let avatarLoadError = $state(false);

  const safeNickname = $derived.by(() => {
    const raw = authUser?.nickname?.trim() ?? '';
    if (!raw) return 'Giocatore';
    if (/^(null|undefined)$/i.test(raw)) return 'Giocatore';
    return raw;
  });

  const userInitial = $derived.by(() => {
    const first = safeNickname.charAt(0);
    return (first && first.length > 0 ? first : 'G').toUpperCase();
  });

  const avatarBgClass = $derived.by(() => authUser?.avatarColor ?? getAvatarBgClass(authUser?.id ?? safeNickname));

  const submitSignOut = () => {
    const form = document.getElementById('signout-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  $effect(() => {
    avatarLoadError = false;
    authUser?.avatarDataUrl;
  });
</script>

<div class="flex items-center gap-2">
  {#if authUser}
    <div class="dropdown dropdown-end">
      <button
        type="button"
        class="btn btn-ghost p-0 h-10 w-10 min-h-10 min-w-10 rounded-full aspect-square overflow-hidden shrink-0"
        aria-label="Apri menu profilo"
      >
        {#if authUser.avatarDataUrl && !avatarLoadError}
          <div class="h-full w-full rounded-full overflow-hidden border border-base-300 bg-base-100 aspect-square shrink-0">
            <img
              src={authUser.avatarDataUrl}
              alt="Avatar profilo"
              class="block h-full w-full object-cover object-center"
              onerror={() => {
                avatarLoadError = true;
              }}
            />
          </div>
        {:else}
          <div class="h-full w-full rounded-full overflow-hidden aspect-square shrink-0">
            <div class={`h-full w-full rounded-full ${avatarBgClass} text-white grid place-items-center aspect-square`}>
              <span class="text-sm font-bold leading-none">{userInitial}</span>
            </div>
          </div>
        {/if}
      </button>
      <ul class="menu dropdown-content mt-3 z-[100] p-2 shadow bg-base-100 rounded-box w-56 border border-base-300">
        <li class="menu-title">
          <span>{safeNickname}</span>
        </li>
        <li><a href="/profile" class="rounded-box transition-colors hover:bg-base-200 focus-visible:bg-base-200">Profilo</a></li>
        {#if authUser.isAdmin}
          <li><a href="/admin/users" class="rounded-box transition-colors hover:bg-base-200 focus-visible:bg-base-200">Gestione utenti</a></li>
        {/if}
        <li>
          <button
            type="button"
            class="w-full text-left rounded-box px-4 py-2 transition-colors hover:bg-base-200 focus-visible:bg-base-200"
            onclick={submitSignOut}
          >
            Esci
          </button>
        </li>
      </ul>
      <form id="signout-form" method="POST" action="?/signOut" class="hidden"></form>
    </div>
  {:else}
    <button type="button" class="btn btn-primary btn-sm" onclick={onOpenLogin}>
      Login
    </button>
  {/if}
</div>
