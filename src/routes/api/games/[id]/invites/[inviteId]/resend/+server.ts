import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import { sendGameInviteEmail } from "$lib/email";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
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
      select: {
        gameMasterId: true,
        name: true,
      },
    });

    if (!game) {
      return json({ error: "Game not found" }, { status: 404 });
    }

    if (game.gameMasterId !== userId) {
      return json(
        { error: "Only the game master can resend invites for this game" },
        { status: 403 }
      );
    }

    // Get the invite details
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      include: {
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
        { error: "Only pending invites can be resent" },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (new Date() > invite.expiresAt) {
      return json(
        { error: "This invite has expired. Please create a new one." },
        { status: 400 }
      );
    }

    // Resend the invitation email
    let emailSent = false;
    let emailErrorMsg = null;

    try {
      await sendGameInviteEmail(invite.email, {
        gameId,
        gameName: game.name,
        inviterName: invite.inviter.displayName || invite.inviter.email,
        inviterEmail: invite.inviter.email,
        inviteToken: invite.token,
        isRegistered: !!invite.user,
      });
      emailSent = true;
      console.log(
        `✅ Resent invitation email to ${invite.email} for game ${game.name}`
      );
    } catch (emailError) {
      console.error(
        `❌ Failed to resend email to ${invite.email}:`,
        emailError
      );
      emailErrorMsg = emailError;
    }

    return json({
      emailSent,
      emailError: emailErrorMsg ? String(emailErrorMsg) : null,
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
