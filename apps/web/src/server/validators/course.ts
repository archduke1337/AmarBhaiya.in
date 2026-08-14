import * as z from "zod";

export const courseSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(200, "Title must be less than 200 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(5000, "Description must be less than 5000 characters."),
  shortDescription: z
    .string()
    .max(500, "Short description must be less than 500 characters.")
    .optional(),
  categoryId: z.string().min(1, "Please select a category."),
  price: z.number().min(0, "Price cannot be negative."),
  accessModel: z.enum(["free", "paid", "subscription"]),
});

export const moduleSchema = z.object({
  title: z
    .string()
    .min(2, "Module title must be at least 2 characters.")
    .max(200, "Module title must be less than 200 characters."),
  description: z.string().max(1000).optional(),
});

export const lessonSchema = z.object({
  title: z
    .string()
    .min(2, "Lesson title must be at least 2 characters.")
    .max(200, "Lesson title must be less than 200 characters."),
  description: z.string().max(2000).optional(),
  isFree: z.boolean().default(false),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message must be less than 5000 characters."),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
