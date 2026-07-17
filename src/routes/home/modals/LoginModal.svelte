<script lang="ts">
  let {
    open = false,
    zIndex = 0,
    honeypotName,
    close,
    signInError = null as string | null
  } = $props();

</script>

{#if open}
  <dialog class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`} onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-semibold">Accedi con CODICE</h3>
      <p class="text-sm text-base-content/70 mt-1">Nessuna password: inserisci il tuo codice personale.</p>

      <form method="POST" action="?/signIn" class="space-y-3 mt-4">
        <input type="text" name={honeypotName} class="hidden" tabindex="-1" autocomplete="off" />
        <label class="form-control w-full">
          <span class="label-text mb-1">Codice</span>
          <input
            type="text"
            name="code"
            class="input input-bordered w-full"
            placeholder="es. 550e8400-e29b-41d4-a716-446655440000"
            required
            maxlength="128"
          />
        </label>

        {#if signInError}
          <p class="text-sm text-error">{signInError}</p>
        {/if}

        <div class="modal-action mt-3">
          <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
          <button type="submit" class="btn btn-primary">Accedi</button>
        </div>
      </form>

      <p class="text-xs text-base-content/60 mt-2">
        Gestione codici admin: <a class="link" href="/admin/users">apri pagina admin</a>
      </p>
    </div>
    <button
      type="button"
      class="modal-backdrop"
      aria-label="Chiudi"
      onclick={close}
    ></button>
  </dialog>
{/if}
