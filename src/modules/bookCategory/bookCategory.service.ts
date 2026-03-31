import CustomError from "../../errors/customError";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { IBookCategory } from "./bookCategory.interface";
import BookCategory from "./bookCategory.model";

const createBookCategory = async (req: any) => {

  const payload: IBookCategory = req.body;
  const image = req.file;

  const result = await BookCategory.create(payload);
  if (!result) throw new CustomError(400, "Failed to create book category");

  //if image is provided, upload it to cloudinary
  if (image) {
    const imageAsset = await uploadToCloudinary(image.path, "bookCategory");
    if (!imageAsset) throw new CustomError(400, "Failed to upload image");

    result.image = {
      public_id: imageAsset.public_id,
      secure_url: imageAsset.secure_url,
    };

    result.save();
    
    await result.save();
  }


  return result;
};

const bookCategoryService = {
  createBookCategory,
};

export default bookCategoryService;
