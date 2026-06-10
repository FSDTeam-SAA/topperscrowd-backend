import express from "express";

import { ecategoryValidation } from "./ecategory.validation";
import { ecategoryController } from "./ecategory.controller";
import { validateRequest } from "../../middleware/validateRequest";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.get("/get-all", ecategoryController.getAllEcategories);

router.post(
    "/create-ecategory",
    validateRequest(ecategoryValidation.createEcategoryValidationSchema),
    auth(USER_ROLE.ADMIN),
    ecategoryController.createEcategory
);

router.patch(
    "/update/:EcatId",
    validateRequest(ecategoryValidation.updateEcategoryValidationSchema),
    auth(USER_ROLE.ADMIN),
    ecategoryController.updateEcategory
);

router.delete("/delete/:EcatId", auth(USER_ROLE.ADMIN), ecategoryController.deleteEcategory);

export const ecategoryRoutes = router;