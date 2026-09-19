import { PrismaClient } from "@prisma/client";

export function assertFound<T>(value: T | null | undefined, message: string): T {
    if (!value) {
        throw new Error(message);
    }
    return value;
}

export async function getUserIdByEmail(
    prisma: PrismaClient,
    email: string,
): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    return assertFound(user?.id, `Missing user for email ${email}`);
}

export async function getTicketCategoryId(
    prisma: PrismaClient,
    concertId: string,
    name: string,
): Promise<string> {
    const category = await prisma.ticketCategory.findFirst({
        where: {
            concert_id: concertId,
            name,
        },
        select: { id: true },
    });

    return assertFound(
        category?.id,
        `Missing ticket category ${name} for concert ${concertId}`,
    );
}

export function chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
        throw new Error("Chunk size must be greater than 0.");
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
}
