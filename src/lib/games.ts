import type {
  Game,
  GameParticipant,
  GameInvite,
  Profile,
  GameInviteStatus,
} from "@prisma/client";

// Type aliases for better developer experience
type GameWithRelations = Game & {
  gameMaster: Profile;
  participants: (GameParticipant & { user: Profile })[];
};

type GameParticipantWithUser = GameParticipant & { user: Profile };

type GameInviteWithRelations = GameInvite & {
  game: Game;
  user: Profile;
  inviter: Profile;
};

export async function createGame(
  name: string,
  boardData: string[][],
  gameMasterId: string
): Promise<Game> {
  const response = await fetch("/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      gameMasterId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create game");
  }

  return response.json();
}

export async function getGame(
  gameId: string
): Promise<GameWithRelations | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      gameMaster: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  return game;
}

export async function getUserGames(userId: string): Promise<Game[]> {
  const response = await fetch(`/api/games?userId=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch games");
  }

  return response.json();
}

export async function joinGame(
  gameId: string,
  userId: string
): Promise<GameParticipant> {
  const participant = await prisma.gameParticipant.create({
    data: {
      gameId,
      userId,
      completedCells: [12], // Center cell (index 12 in 0-24 grid) is free
      score: 1, // Start with 1 for the free space
    },
  });

  return participant;
}

export async function getGameParticipants(
  gameId: string
): Promise<GameParticipantWithUser[]> {
  const participants = await prisma.gameParticipant.findMany({
    where: { gameId },
    include: {
      user: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  return participants;
}

export async function updateParticipantScore(
  gameId: string,
  userId: string,
  completedCells: number[]
): Promise<GameParticipant> {
  const participant = await prisma.gameParticipant.update({
    where: {
      gameId_userId: {
        gameId,
        userId,
      },
    },
    data: {
      completedCells,
      score: completedCells.length,
    },
  });

  return participant;
}

export async function inviteUserToGame(
  gameId: string,
  userEmail: string,
  invitedBy: string
): Promise<GameInvite> {
  const response = await fetch("/api/invites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameId,
      userEmail,
      invitedBy,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to invite user");
  }

  return response.json();
}

export async function getUserInvites(
  userId: string
): Promise<GameInviteWithRelations[]> {
  const response = await fetch(`/api/invites?userId=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch invites");
  }

  return response.json();
}

export async function respondToInvite(
  inviteId: string,
  status: "ACCEPTED" | "DECLINED"
): Promise<GameInvite> {
  const response = await fetch(`/api/invites/${inviteId}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to respond to invite");
  }

  return response.json();
}

export function generateBingoBoard(): string[][] {
  // Generate a 5x5 bingo board with empty strings for now
  // User can customize the content later
  const board: string[][] = [];

  for (let i = 0; i < 5; i++) {
    const row: string[] = [];
    for (let j = 0; j < 5; j++) {
      if (i === 2 && j === 2) {
        row.push("FREE"); // Center cell is always free
      } else {
        row.push(`Cell ${i * 5 + j + 1}`); // Placeholder text
      }
    }
    board.push(row);
  }

  return board;
}
