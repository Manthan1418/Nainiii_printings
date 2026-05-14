import { z } from 'zod'

export const InventoryCreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().min(0).optional().default(0),
  unit: z.string().min(1),
  buyingPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  reorderLevel: z.number().int().min(0).optional().default(0),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  itemType: z.enum(['raw_material', 'finished_good']).optional().default('raw_material'),
  notes: z.string().optional(),
})
