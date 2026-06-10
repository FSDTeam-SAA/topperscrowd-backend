import { Router } from "express";
import { ebookValidation } from "./ebook.validation";
import { ebookController } from "./ebook.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/multer.middleware";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = Router();

// ─── Public: Get all ebooks ──────────────────────────────────────
router.get(
    "/get-all",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Get all ebooks (public)'
    // #swagger.security = []
    ebookController.getAllEbooks
);

// ─── Public: Get single ebook ────────────────────────────────────
router.get(
    "/:ebookId",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Get a single ebook by ID (public)'
    // #swagger.security = []
    ebookController.getSingleEbook
);

// ─── Admin: Create ebook ─────────────────────────────────────────
router.post(
    "/create-ebook",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Create a new ebook (Admin only)'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["title", "slug", "description", "author", "formatType", "category", "coverImage", "file"],
            properties: {
              title: { type: "string", example: "Clean Code" },
              slug: { type: "string", example: "clean-code" },
              description: { type: "string", example: "A handbook of agile software craftsmanship" },
              author: { type: "string", example: "Robert C. Martin" },
              formatType: { type: "string", enum: ["PDF", "EPUB"], example: "PDF" },
              category: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
              isPremium: { type: "string", enum: ["true", "false"], example: "false" },
              coverImage: { type: "string", format: "binary" },
              file: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    auth(USER_ROLE.ADMIN),
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    validateRequest(ebookValidation.createEbookValidationSchema),
    ebookController.createEbook
);

// ─── Admin: Update ebook ─────────────────────────────────────────
router.patch(
    "/:ebookId",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Update an ebook (Admin only)'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              description: { type: "string" },
              author: { type: "string" },
              formatType: { type: "string", enum: ["PDF", "EPUB"] },
              category: { type: "string" },
              isPremium: { type: "string", enum: ["true", "false"] },
              coverImage: { type: "string", format: "binary" },
              file: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    auth(USER_ROLE.ADMIN),
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    validateRequest(ebookValidation.updateEbookValidationSchema),
    ebookController.updateEbook
);

// ─── Admin: Delete ebook ─────────────────────────────────────────
router.delete(
    "/:ebookId",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Delete an ebook (Admin only)'
    // #swagger.security = [{ "bearerAuth": [] }]
    auth(USER_ROLE.ADMIN),
    ebookController.deleteEbook
);

// ─── Authenticated: Track download ───────────────────────────────
router.patch(
    "/:ebookId/download",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Track ebook download (Authenticated users)'
    // #swagger.security = [{ "bearerAuth": [] }]
    auth(USER_ROLE.USER, USER_ROLE.ADMIN),
    ebookController.trackDownload
);

export const ebookRoutes = router;