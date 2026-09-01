import { z } from 'zod'

export const InventoryCreateSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0).optional().default(0),
  unit: z.string().min(1),
  sellingPrice: z.number().nonnegative(),
  categoryId: z.string().optional(),
  type: z.enum(['raw-material', 'finished-product']).default('raw-material'),
  notes: z.string().optional(),
})

