import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import { sendGameInviteEmail } from "$lib/email";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const invites = await prisma.gameInvite.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        game: true,
        user: true,
        inviter: true,
      },
    });

    return json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return json({ error: "Failed to fetch invites" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { gameId, userEmail, invitedBy } = await request.json();

    if (!gameId || !userEmail || !invitedBy) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get game and inviter details for email
    const [game, inviter] = await Promise.all([
      prisma.game.findUnique({
        where: { id: gameId },
      }),
      prisma.profile.findUnique({
        where: { id: invitedBy },
      }),
    ]);

    if (!game || !inviter) {
      return json({ error: "Game or inviter not found" }, { status: 404 });
    }

    // Check if user is already registered
    const existingProfile = await prisma.profile.findUnique({
      where: { email: userEmail },
    });

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if invite already exists for this game and email
    const existingInvite = await prisma.gameInvite.findUnique({
      where: {
        gameId_email: {
          gameId,
          email: userEmail,
        },
      },
    });

    if (existingInvite) {
      if (existingInvite.status === "PENDING") {
        return json(
          {
            error:
              "An invitation has already been sent to this email address for this game",
          },
          { status: 409 }
        );
      } else if (existingInvite.status === "ACCEPTED") {
        return json(
          {
            error: "This user has already accepted an invitation to this game",
          },
          { status: 409 }
        );
      } else if (existingInvite.status === "DECLINED") {
        // Allow re-inviting if they previously declined
        // Delete the old invite and create a new one
        await prisma.gameInvite.delete({
          where: { id: existingInvite.id },
        });
      }
    }

    const invite = await prisma.gameInvite.create({
      data: {
        gameId,
        email: userEmail,
        userId: existingProfile?.id || null,
        invitedBy,
        expiresAt,
      },
    });

    // Send invitation email
    let emailSent = false;
    let emailErrorMsg = null;

    try {
      await sendGameInviteEmail(userEmail, {
        gameId,
        gameName: game.name,
        inviterName: inviter.displayName || inviter.email,
        inviterEmail: inviter.email,
        inviteToken: invite.token,
        isRegistered: !!existingProfile,
      });
      emailSent = true;
      console.log(`✅ Invitation email sent successfully to ${userEmail}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email to ${userEmail}:`, emailError);
      emailErrorMsg = emailError;
      // Continue - invite was created even if email failed
      // But we'll include this info in the response
    }

    return json({
      ...invite,
      emailSent,
      emailError: emailErrorMsg ? String(emailErrorMsg) : null,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return json({ error: "Failed to create invite" }, { status: 500 });
  }
};
