import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  try {
    const token = params.token;

    if (!token) {
      return json({ error: "Token required" }, { status: 400 });
    }

    const invite = await prisma.gameInvite.findUnique({
      where: { token },
      include: {
        game: {
          include: {
            gameMaster: true,
          },
        },
        inviter: true,
      },
    });

    if (!invite) {
      return json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite has expired
    if (invite.expiresAt < new Date()) {
      return json({ error: "Invite has expired" }, { status: 410 });
    }

    // Check if invite has already been accepted
    if (invite.status === "ACCEPTED") {
      return json(
        { error: "Invite has already been accepted" },
        { status: 409 }
      );
    }

    return json(invite);
  } catch (error) {
    console.error("Error fetching invite:", error);
    return json({ error: "Failed to fetch invite" }, { status: 500 });
  }
};
