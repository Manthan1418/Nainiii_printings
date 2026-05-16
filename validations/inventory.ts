import { z } from 'zod'

export const InventoryCreateSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0).optional().default(0),
  unit: z.string().min(1),
  sellingPrice: z.number().nonnegative(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
})

