import { getCloudinaryThumbnailUrl } from "../../utils/cloudinary";

/**
 * Transforms a book category object (or objects).
 */
export const transformBookCategoryResponse = (category: any) => {
  const transform = (item: any) => {
    if (!item) return item;
    return item;
  };

  if (Array.isArray(category)) {
    return category.map(transform);
  }
  return transform(category);
};

/**
 * Transforms a book category object (or objects) and applies thumbnail resizing.
 */
export const transformBookCategoryResponseWithThumbnail = (category: any) => {
  const transformed = transformBookCategoryResponse(category);

  const applyThumbnail = (item: any) => {
    if (!item) return item;
    if (item.image?.secure_url) {
      item.image = {
        ...item.image,
        secure_url: getCloudinaryThumbnailUrl(item.image.secure_url),
      };
    }
    return item;
  };

  if (Array.isArray(transformed)) {
    return transformed.map(applyThumbnail);
  }
  return applyThumbnail(transformed);
};
