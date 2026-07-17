import type { Player, Table, GameWeight, SparePlayer, BGGGame, AuthUser } from '$lib/types';

// Individual modal state classes following OOP principles
class FabMenuState {
  isOpen = $state(false);

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
  defaultBggGame = $state<BGGGame | null>(null);

  open = (table: Table, currentZIndex: number) => {
    this.table = table;
    this.defaultTitle = table.title;
    this.defaultDescription = table.description ?? '';
    this.defaultSeats = table.seats;
    this.defaultWeight = table.weight;
    this.defaultBggGame = table.bggGame ?? null;
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
  table: Table | null = $state(null);

  open = (table: Table) => {
    this.table = table;
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

class LoginModalState {
  isOpen = $state(false);

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
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
  loginModal = new LoginModalState();


  // Shared state
  baseZIndex = $state(0);
  nightDate = $state('');
  viewOrientation = $state<'vertical' | 'horizontal'>('vertical');
  focusedTableId = $state<string | null>(null);
  data = $state<{ tables: Table[]; sparePlayers: SparePlayer[] }>({ tables: [], sparePlayers: [] });
  
  loggedInUser = $state(false);
  authUser: AuthUser | null = $state(null);

  constructor(initialNightDate: string, initialAuthUser: AuthUser | null = null) {
    this.nightDate = initialNightDate;
    this.setAuthUser(initialAuthUser);
  }

  setFocusedTable(tableId: string | null) {
      this.focusedTableId = tableId;
  }
  
  switchOrientation() {
    this.viewOrientation = this.viewOrientation === 'vertical' ? 'horizontal' : 'vertical';
    return this.viewOrientation;
  }

  setViewOrientation(orientation: 'vertical' | 'horizontal') {
    this.viewOrientation = orientation;
  }
  
  setAuthUser(user: AuthUser | null) {
    this.authUser = user;
    this.loggedInUser = Boolean(user);
    if (user?.preferredView) {
      this.viewOrientation = user.preferredView;
    }
  }

  updateNightDate(newDate: string) {
    this.nightDate = newDate;
  }

  updateData(newData: { tables: Table[]; sparePlayers: SparePlayer[] }) {
    this.data = newData;
  }
}
