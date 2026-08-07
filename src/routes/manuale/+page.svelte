<script lang="ts">
  import {
    CalendarIcon,
    CaretRightIcon,
    CheckCircleIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSimpleIcon,
    PlusIcon,
    ShareNetworkIcon,
    TrashIcon,
    UserCircleIcon,
    UserPlusIcon,
    UserIcon,
    UsersIcon
  } from 'phosphor-svelte';
</script>

<main class="min-h-screen bg-base-200 px-4 py-6 sm:px-6 sm:py-10">
  <section class="mx-auto max-w-2xl card border border-base-300 bg-base-100 shadow-sm">
    <div class="border-base-300 border-b border-dashed">
      <div class="flex items-center justify-between gap-3 p-4">
        <div>
          <h1 class="card-title text-2xl">Manuale utente</h1>
          <p class="text-sm text-base-content/70">Le funzioni principali per organizzare la serata.</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="/profile">Torna al profilo</a>
      </div>
    </div>

    <div class="card-body gap-5">
      <section class="alert alert-info alert-soft text-sm">
        <UserCircleIcon size={20} weight="fill" aria-hidden="true" />
        <span>Per usare l'app devi accedere con un codice personale ricevuto dall'associazione. Senza codice puoi consultare tavoli e liste, ma non puoi aggiungere o modificare dati.</span>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg"><CalendarIcon size={20} weight="fill" aria-hidden="true" /> Seleziona la serata</h2>
        <p class="text-sm text-base-content/80">Tocca la data accanto a “Serata” per aprire il calendario, usa le frecce per cambiare mese e seleziona il giorno desiderato. La scelta viene mantenuta anche alle visite successive.</p>
        <p class="text-sm text-base-content/80">Il bollino blu indica una data in cui esiste almeno un tavolo. Il bordo evidenziato indica invece la serata che stai visualizzando.</p>
        <p class="text-sm text-base-content/80">Alla prima apertura viene mostrato il prossimo giovedi; se oggi e giovedi, viene mostrata la serata di oggi.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg">
          <span class="inline-flex items-center gap-1" aria-label="Menu azioni, poi nuovo tavolo">
            <PlusIcon size={20} weight="bold" aria-hidden="true" />
            <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
            <svg class="h-5 w-5" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
              <path d="M25.484,7.114l-4.278-3.917C21.034,3.069,20.825,3,20.61,3H5.38C5.165,3,4.956,3.069,4.783,3.197l-4.38,4C0.403,7.197,0,7.453,0,8v2c0,0.551,0.449,1,1,1h24c0.551,0,1-0.449,1-1V8C26,7.469,25.484,7.114,25.484,7.114z" />
              <path d="M2,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H2z" />
              <path d="M23,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H23z" />
              <path d="M20,18c-0.551,0-1-0.449-1-1v-5h2v5C21,17.551,20.551,18,20,18L20,18z" />
              <path d="M6,18c-0.551,0-1-0.449-1-1v-5h2v5C7,17.551,6.551,18,6,18L6,18z" />
            </svg>
          </span>
          Creare un tavolo
        </h2>
        <p class="text-sm text-base-content/80">Dopo il login, apri il menu galleggiante <PlusIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Menu azioni" /> e poi tocca l'icona del tavolo. Si apre la schermata “Apri un nuovo tavolo”. Il tavolo viene sempre creato per la serata selezionata in quel momento.</p>
        <ol class="list-decimal space-y-2 pl-5 text-sm text-base-content/80">
          <li><span class="font-semibold">Gioco o titolo:</span> scrivi il nome del gioco. Puoi anche cercarlo su BoardGameGeek <MagnifyingGlassIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Cerca gioco" /> e scegliere un risultato dall'elenco.</li>
          <li><span class="font-semibold">Ricerca del gioco:</span> scegliendo un risultato, il modulo propone automaticamente titolo, numero di posti, peso e descrizione. Controlla i dati e cambiali liberamente se non sono adatti alla vostra partita.</li>
          <li><span class="font-semibold">Posti disponibili:</span> indica quante persone possono partecipare, da 1 a 30. Il numero proposto e 4.</li>
          <li><span class="font-semibold">Peso:</span> scegli Party, Leggero, Medio oppure Estremo in base a durata e impegno del gioco.</li>
          <li><span class="font-semibold">Descrizione:</span> aggiungi informazioni utili, per esempio espansioni, regole della serata, lingua del gioco o richieste per i partecipanti.</li>
          <li><span class="font-semibold">Crea:</span> premi “Crea” <CheckCircleIcon class="inline-block align-text-bottom" size={16} weight="fill" aria-label="Crea tavolo" /> per pubblicare il tavolo. Se manca un dato necessario, il titolo e troppo corto oppure esiste gia un tavolo con lo stesso nome per quella serata, viene mostrato un messaggio e puoi correggere il modulo.</li>
        </ol>
        <p class="text-sm text-base-content/80">Usa “Annulla”, la X o il clic fuori dalla finestra per chiudere il modulo senza creare il tavolo. Dopo la creazione, puoi modificare o eliminare soltanto i tavoli creati da te.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg"><UserPlusIcon size={20} weight="bold" aria-hidden="true" /> Partecipare a un gioco</h2>
        <p class="text-sm text-base-content/80">Nella card del tavolo, tocca l'icona <UserPlusIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Partecipa al tavolo" /> per aprire il modulo di partecipazione. Non serve aprire prima i dettagli del tavolo. Usa il tuo nickname e indica, quando richiesto, se sei principiante o se puoi spiegare il gioco.</p>
        <p class="text-sm text-base-content/80">Se non sei gia presente nel tavolo, il campo “Nome giocatore” viene compilato automaticamente con il tuo nickname. Puoi lasciarlo cosi per aggiungerti oppure sostituirlo con il nome di un'altra persona.</p>
        <p class="text-sm text-base-content/80">Per aggiungere un amico senza account, usa lo stesso modulo e sostituisci il nickname precompilato con il suo nome. Puoi indicare se e principiante o se puo spiegare il gioco.</p>
        <p class="text-sm text-base-content/80">Se sei gia presente nel tavolo, il campo parte vuoto: puoi usarlo solo per aggiungere un altro giocatore. Non puoi inserire due volte lo stesso nome nello stesso tavolo.</p>
        <p class="text-sm text-base-content/80">Dai dettagli del tavolo puoi aggiornare <PencilSimpleIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Modifica giocatore" /> o rimuovere <TrashIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Rimuovi giocatore" /> la tua partecipazione. Puoi anche copiare il link del tavolo con <ShareNetworkIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Condividi tavolo" /> per condividerlo.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg">
          <span class="inline-flex items-center gap-1" aria-label="Menu azioni, poi lista compagni di gioco">
            <PlusIcon size={20} weight="bold" aria-hidden="true" />
            <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
            <UserIcon size={20} weight="bold" aria-hidden="true" />
          </span>
          Aggiungersi alla lista dei compagni di gioco
        </h2>
        <p class="text-sm text-base-content/80">Apri il menu galleggiante <PlusIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Menu azioni" /> e poi l'icona della persona <UserIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Aggiungi giocatore alla lista" />. Si apre il modulo per iscrivere te stesso o un amico alla lista dei giocatori indecisi.</p>
        <p class="text-sm text-base-content/80">Inserisci il nome e il peso di gioco preferito. Dopo il salvataggio, la voce compare nella sezione “Sei indeciso?” della serata selezionata, raggruppata per peso di gioco.</p>
        <p class="text-sm text-base-content/80">Apri una categoria per vedere le persone disponibili. Puoi modificare o rimuovere le voci create da te; sono valide solo per la serata selezionata.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg">
          <span class="inline-flex items-center gap-1" aria-label="Menu azioni, poi cambia visualizzazione">
            <PlusIcon size={20} weight="bold" aria-hidden="true" />
            <CaretRightIcon size={14} weight="bold" aria-hidden="true" />
            <EyeIcon size={20} weight="bold" aria-hidden="true" />
          </span>
          Cambiare visualizzazione dei tavoli
        </h2>
        <p class="text-sm text-base-content/80">Apri il menu galleggiante <PlusIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Menu azioni" /> e poi tocca l'icona con l'occhio <EyeIcon class="inline-block align-text-bottom" size={16} weight="bold" aria-label="Cambia visualizzazione" />.</p>
        <p class="text-sm text-base-content/80">Puoi passare dalla visualizzazione verticale a quella orizzontale dei tavoli. L'ultima visualizzazione scelta viene salvata nelle preferenze del tuo profilo.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg"><UserCircleIcon size={20} weight="fill" aria-hidden="true" /> Modificare il proprio profilo</h2>
        <p class="text-sm text-base-content/80">Apri il menu dell'avatar <UserCircleIcon class="inline-block align-text-bottom" size={16} weight="fill" aria-label="Menu profilo" /> e scegli “Profilo”. Qui puoi cambiare nickname e foto profilo oppure rimuovere la foto caricata.</p>
        <p class="text-sm text-base-content/80">Il nickname viene usato per partecipare ai tavoli e per comparire nella lista dei compagni di gioco.</p>
      </section>

      <section class="space-y-2">
        <h2 class="card-title flex items-center gap-2 text-lg"><UsersIcon size={20} weight="fill" aria-hidden="true" /> Netiquette</h2>
        <p class="text-sm text-base-content/80">Usa l'app con rispetto: aggiorna le tue disponibilita, non occupare posti che non userai e avvisa gli altri se cambi programma. Consulta il regolamento dell'associazione Zuga Remni per le regole complete.</p>
      </section>
    </div>
  </section>
</main>