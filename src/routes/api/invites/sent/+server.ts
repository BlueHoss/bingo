import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const sentInvites = await prisma.gameInvite.findMany({
      where: {
        invitedBy: userId,
      },
      include: {
        game: true,
        user: true, // Will be null for unregistered users
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return json(sentInvites);
  } catch (error) {
    console.error("Error fetching sent invites:", error);
    return json({ error: "Failed to fetch sent invites" }, { status: 500 });
  }
};
