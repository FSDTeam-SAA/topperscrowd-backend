import express from "express";

import { ecategoryValidation } from "./ecategory.validation";
import { ecategoryController } from "./ecategory.controller";
import { validateRequest } from "../../middleware/validateRequest";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { upload } from "../../middleware/multer.middleware";

const router = express.Router();

router.get(
    "/get-all",
    // #swagger.tags = ['Ebook Categories']
    // #swagger.summary = 'Get all ebook categories'
    // #swagger.description = 'Retrieve all ebook categories sorted by name.'
    // #swagger.security = []
    /* #swagger.responses[200] = {
      description: 'Categories retrieved successfully'
    } */
    ecategoryController.getAllEcategories
);

router.post(
    "/create-ecategory",
    // #swagger.tags = ['Ebook Categories']
    // #swagger.summary = 'Create an ebook category (Admin only)'
    // #swagger.description = 'Create a category used to organize ebooks.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["name", "slug"],
            properties: {
              name: { type: "string", example: "Programming" },
              slug: { type: "string", example: "programming" },
              description: { type: "string", example: "Technical ebooks and programming guides" },
              isActive: { type: "boolean", example: true },
              image: { type: "string", format: "binary" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[201] = {
      description: 'Category created successfully'
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
    /* #swagger.responses[409] = {
      description: 'Category name or slug already exists'
    } */
    auth(USER_ROLE.ADMIN),
    upload.single("image"),
    validateRequest(ecategoryValidation.createEcategoryValidationSchema),
    ecategoryController.createEcategory
);

router.patch(
    "/update/:EcatId",
    // #swagger.tags = ['Ebook Categories']
    // #swagger.summary = 'Update an ebook category (Admin only)'
    // #swagger.description = 'Update ebook category metadata by category ID.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.parameters['EcatId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook category database ObjectId'
    } */
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", example: "Updated Programming" },
              slug: { type: "string", example: "updated-programming" },
              description: { type: "string", example: "Updated category description" },
              isActive: { type: "boolean", example: true }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = {
      description: 'Category updated successfully'
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
      description: 'Category not found'
    } */
    validateRequest(ecategoryValidation.updateEcategoryValidationSchema),
    auth(USER_ROLE.ADMIN),
    ecategoryController.updateEcategory
);

router.delete(
    "/delete/:EcatId",
    // #swagger.tags = ['Ebook Categories']
    // #swagger.summary = 'Delete an ebook category (Admin only)'
    // #swagger.description = 'Delete an ebook category by category ID.'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.parameters['EcatId'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Ebook category database ObjectId'
    } */
    /* #swagger.responses[200] = {
      description: 'Category deleted successfully'
    } */
    /* #swagger.responses[401] = {
      description: 'Unauthorized'
    } */
    /* #swagger.responses[403] = {
      description: 'Forbidden'
    } */
    /* #swagger.responses[404] = {
      description: 'Category not found'
    } */
    auth(USER_ROLE.ADMIN),
    ecategoryController.deleteEcategory
);

export const ecategoryRoutes = router;
