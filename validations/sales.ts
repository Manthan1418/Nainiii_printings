import { z } from 'zod'

export const SaleItemSchema = z.object({ 
  itemId: z.string().optional(), 
  name: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  quantity: z.number().int().min(1), 
  price: z.number().min(0) 
})

export const SaleCreateSchema = z.object({
  customer: z.string().optional(),
  customerId: z.string().optional(),
  phone: z.string().optional(),
  orderType: z.enum(['bag', 'printing']).optional(),
  status: z.enum(['Pending', 'In Production', 'Completed', 'Delivered', 'Paid']).optional(),
  items: z.array(SaleItemSchema).min(1),
  notes: z.string().optional(),
})
