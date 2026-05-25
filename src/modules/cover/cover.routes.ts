import express from "express";
import { coverValidation } from "./cover.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { coverController } from "./cover.controller";
import { upload } from "../../middleware/multer.middleware";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.post(
  "/create-cover",
  // #swagger.tags = ['Covers']
  // #swagger.summary = 'Create a new book cover (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          required: ["title", "description", "edition", "image"],
          properties: {
            title: { type: "string", example: "Kathor Cover" },
            description: { type: "string", example: "A premium catalog book cover" },
            edition: { type: "string", example: "1st Edition" },
            image: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(coverValidation.createCoverValidationSchema),
  coverController.createCover
);

router.patch(
  "/update-cover/:coverId",
  // #swagger.tags = ['Covers']
  // #swagger.summary = 'Update an existing book cover (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['coverId'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'Cover Database ID'
  } */
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated Kathor Cover" },
            description: { type: "string", example: "An updated premium catalog book cover" },
            edition: { type: "string", example: "2nd Edition" },
            image: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(coverValidation.updateCoverValidationSchema),
  coverController.updateCover
);

router.delete(
  "/delete-cover/:coverId",
  // #swagger.tags = ['Covers']
  // #swagger.summary = 'Delete a book cover (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['coverId'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'Cover Database ID'
  } */
  auth(USER_ROLE.ADMIN),
  coverController.deleteCover
);

router.get(
  "/get-all-covers",
  // #swagger.tags = ['Covers']
  // #swagger.summary = 'Get all book covers with pagination and search'
  // #swagger.security = []
  /* #swagger.parameters['page'] = {
    in: 'query',
    type: 'integer',
    default: 1,
    description: 'Page number'
  } */
  /* #swagger.parameters['limit'] = {
    in: 'query',
    type: 'integer',
    default: 10,
    description: 'Limit per page'
  } */
  /* #swagger.parameters['search'] = {
    in: 'query',
    type: 'string',
    description: 'Search string (title/description/edition)'
  } */
  coverController.getAllCovers
);

router.get(
  "/get-single-cover/:coverId",
  // #swagger.tags = ['Covers']
  // #swagger.summary = 'Get a single book cover by ID'
  // #swagger.security = []
  /* #swagger.parameters['coverId'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'Cover Database ID'
  } */
  coverController.getSingleCover
);

export const coverRoutes = router;