import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const inviteId = params.id;
    const { userId } = await request.json();

    if (!inviteId || !userId) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // First, verify the invite exists and the user has permission to delete it
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      include: {
        game: true,
      },
    });

    if (!invite) {
      return json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if user is the game master (who sent the invite)
    if (invite.invitedBy !== userId) {
      return json(
        { error: "Not authorized to delete this invite" },
        { status: 403 }
      );
    }

    // Delete the invite
    await prisma.gameInvite.delete({
      where: { id: inviteId },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return json({ error: "Failed to delete invite" }, { status: 500 });
  }
};
