import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const gameId = params.id;
    const inviteId = params.inviteId;
    const { userId } = await request.json();

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
        { error: "Only the game master can delete invites for this game" },
        { status: 403 }
      );
    }

    // Verify the invite exists and belongs to this game
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      select: { gameId: true, status: true },
    });

    if (!invite) {
      return json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.gameId !== gameId) {
      return json(
        { error: "Invite does not belong to this game" },
        { status: 400 }
      );
    }

    if (invite.status !== "PENDING") {
      return json(
        { error: "Only pending invites can be deleted" },
        { status: 400 }
      );
    }

    // Delete the invite
    await prisma.gameInvite.delete({
      where: { id: inviteId },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting game invite:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
