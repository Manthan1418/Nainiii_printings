import { z } from 'zod'

export const SaleItemSchema = z.object({ itemId: z.string(), quantity: z.number().int().min(1), price: z.number().min(0) })

export const SaleCreateSchema = z.object({
  customer: z.string().optional(),
  phone: z.string().optional(),
  items: z.array(SaleItemSchema).min(1),
  notes: z.string().optional(),
})
