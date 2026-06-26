import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { fileCleanup } from "../../utils/fileCleanup";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/cloudinary";
import { IEcategory } from "./ecategory.interface";
import { Category } from "./ecategory.model";

const createEcategoryIntoDB = async (req: any): Promise<IEcategory> => {
  const payload: IEcategory = { ...req.body };
  delete (payload as any).image;
  const image = req.file;

  const existingCategory = await Category.findOne({
    $or: [{ name: payload.name }, { slug: payload.slug }],
  });

  if (existingCategory) {
    fileCleanup(req);
    throw new AppError("Category name or slug already exists", StatusCodes.CONFLICT);
  }

  let uploadedImage:
    | {
        public_id: string;
        secure_url: string;
        resource_type: "image" | "video" | "raw";
      }
    | undefined;

  try {
    if (image) {
      uploadedImage = await uploadToCloudinary(image.path, "ecategories");
      payload.image = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    const result = await Category.create(payload);
    return result;
  } catch (error) {
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id, uploadedImage.resource_type).catch(
        () => undefined,
      );
    }

    throw error;
  }
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
