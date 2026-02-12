import type { Player, Table, GameWeight } from '$lib/types';

// Individual modal state classes following OOP principles
class FabMenuState {
  isOpen = $state(false);

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };

  toggle = () => {
    this.isOpen = !this.isOpen;
  };
}

class CreateTableModalState {
  isOpen = $state(false);

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };
}

class AddSparePlayerModalState {
  isOpen = $state(false);

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };
}

class EditTableModalState {
  isOpen = $state(false);
  table: Table | null = $state(null);
  zIndex = $state(0);
  defaultTitle = $state('');
  defaultDescription = $state('');
  defaultSeats: number | string = $state(4);
  defaultWeight: GameWeight | '' = $state('');

  open = (table: Table, currentZIndex: number) => {
    this.table = table;
    this.defaultTitle = table.title;
    this.defaultDescription = table.description ?? '';
    this.defaultSeats = table.seats;
    this.defaultWeight = table.weight;
    this.zIndex = currentZIndex + 1;
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.table = null;
  };
}

class DeleteTableModalState {
  isOpen = $state(false);
  table: { id: string; title: string } | null = $state(null);
  zIndex = $state(0);

  open = (table: Table, currentZIndex: number) => {
    this.table = { id: table.id, title: table.title };
    this.zIndex = currentZIndex + 1;
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.table = null;
  };
}

class DetailTableModalState {
  isOpen = $state(false);
  tableId: string | null = $state(null);

  open = (tableId: string) => {
    this.tableId = tableId;
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.tableId = null;
  };
}

class AddPlayerModalState {
  isOpen = $state(false);
  table: { id: string; title: string; nightDate: string } | null = $state(null);

  open = (table: Table) => {
    this.table = {
      id: table.id,
      title: table.title,
      nightDate: table.nightDate
    };
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.table = null;
  };
}

class DetailPlayerModalState {
  isOpen = $state(false);
  data: { tableId: string; player: Player } | null = $state(null);

  open = (tableId: string, player: Player) => {
    this.data = { tableId, player };
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.data = null;
  };
}

class EditPlayerModalState {
  isOpen = $state(false);
  data: { tableId: string; player: Player } | null = $state(null);

  open = (tableId: string, player: Player) => {
    this.data = { tableId, player: { ...player } };
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.data = null;
  };
}

class DeletePlayerModalState {
  isOpen = $state(false);
  player: { tableId: string; playerId: string; playerName: string } | null = $state(null);

  open = (tableId: string, playerId: string, playerName: string) => {
    this.player = { tableId, playerId, playerName };
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.player = null;
  };
}

export class PageStateManager {
  // Modal instances
  fabMenu = new FabMenuState();
  createTableModal = new CreateTableModalState();
  addSparePlayerModal = new AddSparePlayerModalState();
  editTableModal = new EditTableModalState();
  deleteTableModal = new DeleteTableModalState();
  detailTableModal = new DetailTableModalState();
  addPlayerModal = new AddPlayerModalState();
  detailPlayerModal = new DetailPlayerModalState();
  editPlayerModal = new EditPlayerModalState();
  deletePlayerModal = new DeletePlayerModalState();

  // Shared state
  baseZIndex = $state(0);
  nightDate = $state('');
  focusedTableId = $state<string | null>(null);

  constructor(initialNightDate: string) {
    this.nightDate = initialNightDate;
  }

  setFocusedTable(tableId: string | null) {
    this.focusedTableId = tableId;
  }

  updateNightDate(newDate: string) {
    this.nightDate = newDate;
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
