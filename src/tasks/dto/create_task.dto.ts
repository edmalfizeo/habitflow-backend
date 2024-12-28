import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
  deadline: z.string().datetime({ message: 'Invalid date format' }).optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
