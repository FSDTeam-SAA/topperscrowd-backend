import { Router } from "express";
import authController from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidationSchema } from "./auth.validation";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { loginLimiter } from "../../middleware/security";

const router = Router();

router.post(
  "/login",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Login with email & password'
  // #swagger.security = []
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            password: { type: "string", example: "password123" }
          }
        }
      }
    }
  } */
  loginLimiter,
  validateRequest(authValidationSchema.authValidation),
  authController.login
);

router.post(
  "/refresh-token",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Refresh access token'
  // #swagger.security = []
  authController.refreshToken
);

router.post(
  "/forgot-password",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Request password reset OTP'
  // #swagger.security = []
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", example: "user@example.com" }
          }
        }
      }
    }
  } */
  authController.forgotPassword
);

router.post(
  "/resend-forgot-otp",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Resend forgot password OTP'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  authController.resendForgotOtpCode
);

router.post(
  "/verify-otp",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Verify OTP code'
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
  authController.verifyOtp
);

router.post(
  "/reset-password",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Reset password after OTP verification'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["newPassword", "confirmPassword"],
          properties: {
            newPassword: { type: "string", example: "newPass123" },
            confirmPassword: { type: "string", example: "newPass123" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  authController.resetPassword
);

router.post(
  "/change-password",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Change password (logged in user)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["oldPassword", "newPassword"],
          properties: {
            oldPassword: { type: "string", example: "oldPass123" },
            newPassword: { type: "string", example: "newPass123" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  authController.changePassword
);

const authRouter = router;
export default authRouter;
