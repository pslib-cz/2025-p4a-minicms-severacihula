import { z } from "zod";

export const createTripSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  description: z.string().min(1),
  publishDate: z.coerce.date(),
  published: z.boolean().default(false),
  tagIds: z.array(z.string()).optional().default([]),
});

export const updateTripSchema = createTripSchema.partial();

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
