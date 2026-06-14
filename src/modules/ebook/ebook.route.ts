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
    // #swagger.summary = 'Get all ebooks'
    // #swagger.description = 'Retrieve all ebooks, optionally filtered by ebook category, format, or status. Premium ebook file URLs are hidden from public catalog responses.'
    // #swagger.security = []
    /* #swagger.parameters['category'] = {
      in: 'query',
      type: 'string',
      description: 'Ebook category ObjectId'
    } */
    /* #swagger.parameters['formatType'] = {
      in: 'query',
      type: 'string',
      enum: ['PDF', 'EPUB'],
      description: 'Filter ebooks by document format'
    } */
    /* #swagger.parameters['status'] = {
      in: 'query',
      type: 'string',
      enum: ['active', 'inactive', 'all'],
      description: 'Filter ebooks by commerce availability status'
    } */
    /* #swagger.responses[200] = {
      description: 'Ebooks retrieved successfully'
    } */
    ebookController.getAllEbooks
);

// ─── Public: Get single ebook ────────────────────────────────────
router.get(
    "/:ebookId",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Get a single ebook by ID (public)'
    // #swagger.description = 'Retrieve one ebook with populated category details. Premium ebook file URLs are hidden until purchased.'
    // #swagger.security = []
    /* #swagger.parameters['ebookId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook database ObjectId'
    } */
    /* #swagger.responses[200] = {
      description: 'Ebook retrieved successfully'
    } */
    /* #swagger.responses[404] = {
      description: 'Ebook item not found'
    } */
    ebookController.getSingleEbook
);

// ─── Admin: Create ebook ─────────────────────────────────────────
router.post(
    "/create-ebook",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Create a new ebook (Admin only)'
    // #swagger.description = 'Create a PDF or EPUB ebook with a cover image and resource file.'
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
              price: { type: "number", example: 12.99 },
              isPremium: { type: "string", enum: ["true", "false"], example: "false" },
              status: { type: "string", enum: ["active", "inactive"], example: "active" },
              coverImage: { type: "string", format: "binary" },
              file: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[201] = {
      description: 'Ebook created successfully'
    } */
    /* #swagger.responses[400] = {
      description: 'Invalid payload or missing files'
    } */
    /* #swagger.responses[401] = {
      description: 'Unauthorized'
    } */
    /* #swagger.responses[403] = {
      description: 'Forbidden'
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
    // #swagger.description = 'Update ebook metadata and optionally replace the cover image or ebook file.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.parameters['ebookId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook database ObjectId'
    } */
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
              price: { type: "number" },
              isPremium: { type: "string", enum: ["true", "false"] },
              status: { type: "string", enum: ["active", "inactive"] },
              coverImage: { type: "string", format: "binary" },
              file: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = {
      description: 'Ebook updated successfully'
    } */
    /* #swagger.responses[400] = {
      description: 'Invalid payload'
    } */
    /* #swagger.responses[401] = {
      description: 'Unauthorized'
    } */
    /* #swagger.responses[403] = {
      description: 'Forbidden'
    } */
    /* #swagger.responses[404] = {
      description: 'Ebook item not found'
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
    // #swagger.description = 'Delete an ebook record and queue cleanup of its Cloudinary assets.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.parameters['ebookId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook database ObjectId'
    } */
    /* #swagger.responses[200] = {
      description: 'Ebook deleted successfully'
    } */
    /* #swagger.responses[401] = {
      description: 'Unauthorized'
    } */
    /* #swagger.responses[403] = {
      description: 'Forbidden'
    } */
    /* #swagger.responses[404] = {
      description: 'Ebook item not found'
    } */
    auth(USER_ROLE.ADMIN),
    ebookController.deleteEbook
);

// ─── Authenticated: Track download ───────────────────────────────
router.patch(
    "/:ebookId/download",
    // #swagger.tags = ['Ebooks']
    // #swagger.summary = 'Download/access an ebook after ownership check'
    // #swagger.description = 'Requires purchase for premium ebooks. Increments the download counter and returns the ebook with file URL when access is allowed.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.parameters['ebookId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook database ObjectId'
    } */
    /* #swagger.responses[200] = {
      description: 'Download metric incremented successfully'
    } */
    /* #swagger.responses[401] = {
      description: 'Unauthorized'
    } */
    /* #swagger.responses[404] = {
      description: 'Ebook item not found'
    } */
    auth(USER_ROLE.USER, USER_ROLE.ADMIN),
    ebookController.trackDownload
);

export const ebookRoutes = router;
