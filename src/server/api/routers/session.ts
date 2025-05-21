import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import axios from "axios";

const prisma = new PrismaClient();

export const sessionRouter = createTRPCRouter({
  createSession: publicProcedure
  .input(z.object({ username: z.string().min(1).max(20), type: z.string(), longitude: z.number(), latitude: z.number(), }))
  .mutation(async ({ input }) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    

    const session = await prisma.session.create({
      data: { code, type: input.type, latitude: input.latitude, longitude: input.longitude },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        sessionId: session.id,
        username: input.username,
      },
    });
    
    if (existingUser) throw new Error("Username already taken in this session");
    const user = await prisma.user.create({
      data: {
        username: input.username,
        sessionId: session.id,
      },
    });

    return {
      sessionId: session.id,
      code: session.code,
      userId: user.id,
      username: user.username,
      type: session.type,
      latitude: session.latitude,
      longitude: session.longitude,
    };
  }),

fetchNearbyPlaces: publicProcedure
.input(
  z.object({
    latitude: z.number(),
    longitude: z.number(),
    type: z.string(),
  })
)
.query(async ({ input }) => {
  const { latitude, longitude, type } = input;
  const apiKey = process.env.MAPS_API;

  if (!apiKey) {
    throw new Error("Google Maps API key is not configured.");
  } 

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 1500, // Search within 1.5km
          type,
          key: apiKey,
        },
      }
    );

    return response.data.results; // Return the list of places
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    throw new Error("Failed to fetch nearby places.");
  }
}),

joinSession: publicProcedure
  .input(z.object({ code: z.string().length(6),
    username: z.string().min(1).max(20),
   }))
  .mutation(async ({ input }) => {
    const session = await prisma.session.findUnique ({
      where: { code: input.code },
      include: { users: {
        orderBy: {
          createdAt: 'asc' },
        },
      },
    });
  
    if (!session) throw new Error("Session not found");

    const existingUser = await prisma.user.findFirst({
      where: {
        sessionId: session.id,
        username: input.username,
      },
    });
    if (existingUser) throw new Error("Username already taken in this session");

    // Create new user for this session
    const user = await prisma.user.create({
      data: {
        sessionId: session.id,
        username: input.username,
      },
    });

    return {
      sessionId: session.id,
      userId: user.id,
      username: user.username,
      code: session.code,
      type: session.type,
      longitude: session.longitude,
      latitude: session.latitude,
    };
  }),
  updateSessionType: publicProcedure
  .input(z.object({ sessionId: z.string(), type: z.string() }))
  .mutation(async ({ input }) => {
    const updated = await prisma.session.update({
      where: { id: input.sessionId },
      data: { type: input.type },
    });
    return updated;
  }),

  voteForPlace: publicProcedure
    .input(z.object({ sessionId: z.string(), userId: z.string(), placeId: z.string() }))
    .mutation(async ({ input }) => {

    const place = await prisma.place.findUnique({
      where: {id_sessionId: { id: input.placeId,
                sessionId: input.sessionId,
       },
      }
    });

    if (!place) {
      await prisma.place.create({
        data: {
          id: input.placeId,
          sessionId: input.sessionId,
        },
      });
    } else if (place.sessionId !== input.sessionId) {
      throw new Error("Place is not part of this session");
    }
          
    

        
      const existingPlace = await prisma.place.findUnique({
        where: {id_sessionId: { id: input.placeId, sessionId: input.sessionId },
      }
    });

      if (!existingPlace) {
        await prisma.place.create({
          data: {
            id: input.placeId,
            sessionId : input.sessionId,
          },
        });
      }
      const alreadyVoted = await prisma.vote.findUnique({
        where: {
          sessionId_userId_placeID: {
            sessionId: input.sessionId,
            userId: input.userId,
            placeID: input.placeId,
          },
        },
      });

      if (alreadyVoted) {
        throw new Error("You've already voted for this place.");
      }

      const vote = await prisma.vote.create({
        data: {
          sessionId: input.sessionId,
          userId: input.userId,
          placeID: input.placeId,
        },
      });

      return vote;

    }),
  

 getConsensusVote: publicProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const votes = await prisma.vote.findMany({
      where: { sessionId: input.sessionId },
    });

    const totalUsers = await prisma.user.count({
      where: { sessionId: input.sessionId },
    });

    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.placeID] = (acc[vote.placeID] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const winningPlace = Object.entries(voteCounts).find(
      ([_, count]) => count === totalUsers
    );

    console.log("Total users (from server):", totalUsers);
    console.log("Vote counts:", voteCounts);

    return {
      winner: winningPlace?.[0] ?? null,
      voteCounts,
    };
  }),

  getSessionInfo: publicProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const session = await prisma.session.findUnique({
      where: { id: input.sessionId },
    });
    if (!session) throw new Error("Session not found");
    return {
      type: session.type,
      latitude: session.latitude,
      longitude: session.longitude,
    };
  }),

  getSessionUserCount: publicProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const count = await prisma.user.count({
      where: { sessionId: input.sessionId },
    });
    return { count };
  }),

  getUsersInSession: publicProcedure
    .input(z.object({ sessionCode: z.string().length(6)}))
    .query(async ({ input }) => {
      const session = await prisma.session.findUnique({
        where: { code: input.sessionCode },
      include: { users: {
        orderBy: {
          createdAt: 'asc' },
        },
      },
      });

      if (!session) throw new Error("Session not found");
      return session.users.map((user) => ({
        id: user.id,
        username: user.username,
      }))
    })

});