import { z } from 'zod';

const preservedNonBlankSource = z.string().refine(
  (value) => value.trim().length > 0,
  'Content block source must not be blank',
);

export const textContentBlockSchema = z.object({
  type: z.literal('text'),
  content: preservedNonBlankSource,
}).strict();

export const codeContentBlockSchema = z.object({
  type: z.literal('code'),
  language: z.string().trim().min(1).optional(),
  content: preservedNonBlankSource,
}).strict();

export const mathContentBlockSchema = z.object({
  type: z.literal('math'),
  content: preservedNonBlankSource,
}).strict();

export const contentBlockSchema = z.discriminatedUnion('type', [
  textContentBlockSchema,
  codeContentBlockSchema,
  mathContentBlockSchema,
]);

export const contentBlocksSchema = z.array(contentBlockSchema).min(1);

export type TextContentBlock = z.infer<typeof textContentBlockSchema>;
export type CodeContentBlock = z.infer<typeof codeContentBlockSchema>;
export type MathContentBlock = z.infer<typeof mathContentBlockSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
