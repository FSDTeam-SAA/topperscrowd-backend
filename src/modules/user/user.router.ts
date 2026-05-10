import { Router } from "express";
import userController from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middleware/auth";
import { USER_ROLE } from "./user.constant";
import { upload } from "../../middleware/multer.middleware";

const router = Router();

router.post(
  "/register",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Register a new user'
  // #swagger.security = []
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "password123" }
          }
        }
      }
    }
  } */
  validateRequest(userValidation.userValidationSchema),
  userController.registerUser
);

router.post(
  "/verify-email",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Verify email with OTP'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["otp"],
          properties: {
            otp: { type: "string", example: "123456" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  userController.verifyEmail
);

router.post(
  "/resend-otp",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Resend email verification OTP'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  userController.resendOtpCode
);

router.get(
  "/all-users",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get all users'
  // #swagger.security = []
  userController.getAllUsers
);

router.get(
  "/my-profile",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get current user profile'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  userController.getMyProfile
);

router.put(
  "/update-profile",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Update user profile (with optional image)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            image: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  upload.single("image"),
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  userController.updateUserProfile
);

router.get(
  "/admin_id",
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get admin user ID'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  userController.getAdminId
);

const userRouter = router;
export default userRouter;
