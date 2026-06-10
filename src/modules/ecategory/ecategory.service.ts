import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { IEcategory } from "./ecategory.interface";
import { Category } from "./ecategory.model";

const createEcategoryIntoDB = async (payload: IEcategory): Promise<IEcategory> => {
  const existingCategory = await Category.findOne({
    $or: [{ name: payload.name }, { slug: payload.slug }],
  });

  if (existingCategory) {
    throw new AppError("Category name or slug already exists", StatusCodes.CONFLICT);
  }

  const result = await Category.create(payload);
  return result;
};

const getAllEcategoriesFromDB = async (): Promise<IEcategory[]> => {
  const result = await Category.find().sort({ name: 1 });
  return result;
};

const updateEcategoryInDB = async (
  EcatId: string,
  payload: Partial<IEcategory>
): Promise<IEcategory | null> => {
  const isCategoryExist = await Category.findById(EcatId);
  if (!isCategoryExist) {
    throw new AppError("Category not found", StatusCodes.NOT_FOUND);
  }

  const result = await Category.findByIdAndUpdate(EcatId, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteEcategoryFromDB = async (EcatId: string): Promise<IEcategory | null> => {
  const isCategoryExist = await Category.findById(EcatId);
  if (!isCategoryExist) {
    throw new AppError("Category not found", StatusCodes.NOT_FOUND);
  }

  const result = await Category.findByIdAndDelete(EcatId);
  return result;
};

export const ecategoryService = {
  createEcategoryIntoDB,
  getAllEcategoriesFromDB,
  updateEcategoryInDB,
  deleteEcategoryFromDB,
};