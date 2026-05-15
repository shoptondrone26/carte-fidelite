import { z } from "zod";

export const bookingIdSchema = z.string().uuid();

export const slotStartSchema = z.string().datetime({ offset: true });

export type BookingIdInput = z.infer<typeof bookingIdSchema>;
