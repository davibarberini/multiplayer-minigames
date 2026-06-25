import asteridleImg from "../assets/games/asteridle.svg";
import marathonImg from "../assets/games/marathon.svg";

export type GameCategory = "singleplayer" | "multiplayer";

export interface PortalGame {
  id: string;
  titleKey: string;
  descriptionKey: string;
  image: string;
  category: GameCategory;
  /** External URL for single-player games hosted elsewhere */
  externalUrl?: string;
  /** Internal portal action for games in this app */
  internalAction?: "multiplayer-marathon";
}

export const PORTAL_GAMES: PortalGame[] = [
  {
    id: "asteridle",
    titleKey: "portal.games.asteridle.title",
    descriptionKey: "portal.games.asteridle.description",
    image: asteridleImg,
    category: "singleplayer",
    externalUrl: "https://davibarberini.github.io/asteridle/",
  },
  {
    id: "minigames-marathon",
    titleKey: "portal.games.marathon.title",
    descriptionKey: "portal.games.marathon.description",
    image: marathonImg,
    category: "multiplayer",
    internalAction: "multiplayer-marathon",
  },
];

export function getGamesByCategory(category: GameCategory): PortalGame[] {
  return PORTAL_GAMES.filter((game) => game.category === category);
}
