import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const gameId = params.id;
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify the user is the game master for this game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { gameMasterId: true },
    });

    if (!game) {
      return json({ error: "Game not found" }, { status: 404 });
    }

    if (game.gameMasterId !== userId) {
      return json(
        { error: "Only the game master can view invites for this game" },
        { status: 403 }
      );
    }

    // Get all invites for this specific game
    const invites = await prisma.gameInvite.findMany({
      where: {
        gameId: gameId,
      },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return json(invites);
  } catch (error) {
    console.error("Error fetching game invites:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
