import { json } from "@sveltejs/kit";
import { prisma } from "$lib/prisma";
import { supabase } from "$lib/supabase";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, params, cookies }) => {
  try {
    const gameId = params.id;
    const { userId, userEmail, displayName } = await request.json();

    if (!userId) {
      return json({ error: "User ID required" }, { status: 400 });
    }

    console.log(`🔍 Checking for profile with userId: ${userId}`, {
      userEmail,
      displayName,
    });

    // Check if profile exists, if not create it with Supabase user data
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      console.log(`❌ No profile found for userId: ${userId}, creating one...`);

      // Look for an invitation for this game to get email info
      const gameInvite = await prisma.gameInvite.findFirst({
        where: {
          gameId,
          status: "PENDING",
        },
      });

      if (!gameInvite) {
        console.error(`❌ No pending invite found for game: ${gameId}`);
        return json(
          { error: "No valid invitation found for this game" },
          { status: 404 }
        );
      }

      console.log(`📧 Found invite for email: ${gameInvite.email}`);

      // Use provided display name or fall back to email prefix
      const profileDisplayName =
        displayName ||
        userEmail?.split("@")[0] ||
        gameInvite.email.split("@")[0];

      console.log(
        `👤 Creating profile with display name: ${profileDisplayName}`
      );

      // Create profile with invite email data and proper display name
      try {
        profile = await prisma.profile.create({
          data: {
            id: userId,
            email: gameInvite.email,
            displayName: profileDisplayName,
          },
        });

        console.log(
          `✅ Created profile for user: ${profile.email} (id: ${profile.id})`
        );
      } catch (createError) {
        console.error(`❌ Failed to create profile:`, createError);
        return json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    } else {
      console.log(
        `✅ Found existing profile: ${profile.email} (id: ${profile.id})`
      );
    }

    // Get the game and verify it's active
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "ACTIVE") {
      return json({ error: "Game is not active" }, { status: 400 });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.gameParticipant.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return json({ error: "User already joined this game" }, { status: 400 });
    }

    // Generate randomized board for this participant
    const participantBoard = generateRandomizedBoard(game.wordList);

    // Add participant
    console.log(
      `👥 Creating game participant for game: ${gameId}, user: ${userId}`
    );

    try {
      const participant = await prisma.gameParticipant.create({
        data: {
          gameId,
          userId,
          boardData: participantBoard,
          completedCells: [12], // Center cell starts completed
        },
        include: {
          user: true,
        },
      });

      console.log(`✅ Created game participant for user: ${userId}`);

      // Update invite status if this user was invited
      const updatedInvites = await prisma.gameInvite.updateMany({
        where: {
          gameId,
          email: profile.email,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
          userId: userId,
        },
      });

      if (updatedInvites.count > 0) {
        console.log(
          `✅ Updated ${updatedInvites.count} invite(s) to ACCEPTED for ${profile.email}`
        );
      }

      console.log(
        `✅ User ${profile.email} successfully joined game: ${game.name}`
      );

      return json(participant);
    } catch (participantError) {
      console.error(`❌ Failed to create game participant:`, participantError);
      return json(
        { error: "Failed to join game - participant creation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error joining game:", error);
    return json({ error: "Failed to join game" }, { status: 500 });
  }
};

function generateRandomizedBoard(wordList: string[]): string[] {
  // Shuffle the word list
  const shuffled = [...wordList].sort(() => Math.random() - 0.5);

  // Create 25-cell board with FREE SPACE in center (index 12)
  const board: string[] = [];
  let wordIndex = 0;

  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      board[i] = "FREE SPACE";
    } else {
      board[i] = shuffled[wordIndex];
      wordIndex++;
    }
  }

  return board;
}
