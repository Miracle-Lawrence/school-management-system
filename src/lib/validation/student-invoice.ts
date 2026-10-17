import { z } from "zod";

export const createTermInvoiceSchema = z.object({
  studentId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  termId: z.number().int().positive(),
  dueDate: z.iso.date().optional(),
});

export type CreateTermInvoiceInput = z.infer<typeof createTermInvoiceSchema>;

export const createFeePaymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().finite().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER"]),
  notes: z.string().trim().max(500).optional(),
});

export type CreateFeePaymentInput = z.infer<typeof createFeePaymentSchema>;
