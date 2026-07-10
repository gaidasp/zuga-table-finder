<script lang="ts">
  import { enhance } from '$app/forms';
  import { X } from 'phosphor-svelte';

  let { zIndex = 0, nightDate = null, honeypotName = '',  selected } = $props();
  let nightPicker: HTMLInputElement | null = null;
  let nightForm: HTMLFormElement | null = null;
  
  const formatNightDate = (value: string) => {
    if (!value) return 'Seleziona una data';
    const nightDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nightDate.getTime())) return 'Seleziona una data';
    return nightDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const openNightPicker = () => {
    if (!nightPicker) return;
    if ('showPicker' in nightPicker && typeof nightPicker.showPicker === 'function') {
      nightPicker.showPicker();
    } else {
      nightPicker.click();
    }
  };

  const keepNightDate = ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
    return async ({ result }: any) => {
      if (result?.type === 'success') {
        const data = result.data as any;
        const newNightDate = data?.nightDate;
        selected(newNightDate);
      } 
    };
  };

  const handleNightDateChange = () => {
    nightForm?.requestSubmit();
  };
</script>

<div class="flex flex-wrap items-center gap-2">
  <span class="text-sm">Serata:</span>
  <form
    method="POST"
    action="?/setNightDate"
    use:enhance={keepNightDate}
    bind:this={nightForm}
    class="flex items-center gap-2"
  >
    <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
    <button type="button" class="btn btn-sm btn-outline" onclick={openNightPicker}>
      {formatNightDate(nightDate)}
    </button>
    <input
      type="date"
      name="nightDate"
      class="sr-only"
      aria-label="Seleziona la data della serata"
      bind:this={nightPicker}
      bind:value={nightDate}
      onchange={handleNightDateChange}
    />
  </form>
</div>
