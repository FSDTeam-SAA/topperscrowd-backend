import { z } from "zod";

const sendMessageSchema = z.object({
  body: z.object({
    content: z
      .string({
        required_error: "Message content is required",
      })
      .min(1)
      .max(2000),
    replyTo: z
      .object({
        messageId: z.string(),
        // senderName: z.string(),
        // contentPreview: z.string(),
      })
      .optional(),
  }),
});

const reactToMessageSchema = z.object({
  body: z.object({
    emoji: z
      .string({
        required_error: "Emoji is required",
      })
      .min(1, "Emoji is required"),
  }),
});

export const ChatroomValidation = {
  sendMessageSchema,
  reactToMessageSchema,
};
