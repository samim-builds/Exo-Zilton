import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  country: z.string().min(2, "Please select a country"),
  product: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().min(1, "Minimum quantity is 1").max(99, "Maximum quantity is 99"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

export const countries = [
  "Pakistan",
  "United Kingdom",
  "United States",
  "United Arab Emirates",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Other",
];
