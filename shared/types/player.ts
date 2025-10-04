export interface Player {
  id: string;
  username: string;
  color: string;
  score: number;
  isHost: boolean;
  isSpectator: boolean;
}
