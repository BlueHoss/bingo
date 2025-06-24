import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import { generateBingoBoard } from "$lib/client-games";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log("Creating game - starting...");
    const { name, gameMasterId, userEmail } = await request.json();
    console.log("Request data:", { name, gameMasterId, userEmail });

    if (!name || !gameMasterId) {
      console.log("Missing required fields");
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure user profile exists
    console.log("Checking if user profile exists...");
    let profile = await prisma.profile.findUnique({
      where: { id: gameMasterId },
    });

    if (!profile) {
      console.log("Profile doesn't exist, creating one...");
      if (!userEmail) {
        return json(
          { error: "User email required for new profiles" },
          { status: 400 }
        );
      }

      profile = await prisma.profile.create({
        data: {
          id: gameMasterId,
          email: userEmail,
          displayName: userEmail.split("@")[0], // Use email prefix as default display name
        },
      });
      console.log("Profile created:", profile.id);
    }

    console.log("Creating game in database...");
    const game = await prisma.game.create({
      data: {
        name,
        gameMasterId,
        status: "SETUP",
      },
    });
    console.log("Game created successfully:", game.id);

    return json(game);
  } catch (error) {
    console.error("Error creating game - detailed:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return json(
      {
        error: "Failed to create game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Get games where user is a participant
    const participantGames = await prisma.game.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
    });

    // Get games where user is the game master
    const masterGames = await prisma.game.findMany({
      where: {
        gameMasterId: userId,
      },
    });

    // Combine and deduplicate
    const allGames = [...masterGames, ...participantGames];
    const uniqueGames = allGames.filter(
      (game, index, self) => index === self.findIndex((g) => g.id === game.id)
    );

    return json(uniqueGames);
  } catch (error) {
    console.error("Error fetching games:", error);
    return json({ error: "Failed to fetch games" }, { status: 500 });
  }
};
