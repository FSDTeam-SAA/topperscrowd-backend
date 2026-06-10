import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ecategoryService } from "./ecategory.service";

const createEcategory = catchAsync(async (req: Request, res: Response) => {
  const result = await ecategoryService.createEcategoryIntoDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const getAllEcategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await ecategoryService.getAllEcategoriesFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const updateEcategory = catchAsync(async (req: Request, res: Response) => {
  const { EcatId } = req.params;
  const result = await ecategoryService.updateEcategoryInDB(EcatId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteEcategory = catchAsync(async (req: Request, res: Response) => {
  const { EcatId } = req.params;
  const result = await ecategoryService.deleteEcategoryFromDB(EcatId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const ecategoryController = {
  createEcategory,
  getAllEcategories,
  updateEcategory,
  deleteEcategory,
};