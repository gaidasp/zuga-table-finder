export type BGGGame = {
  id: string;
  name: string;
  yearPublished?: string;
  image?: string;
  url?: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
};
