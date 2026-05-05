import config from "../../config";
import { getCloudinaryThumbnailUrl } from "../../utils/cloudinary";
import { USER_ROLE } from "../user/user.constant";

/**
 * Transforms a book object (or objects) to handle conditional audio visibility.
 * In production, non-admins without a purchase will only see `hasAudio`.
 */
export const transformBookResponse = (
  book: any,
  user: { id: string; role: string } | null,
  purchasedBookIds: string[] = []
) => {
  const isProduction = config.nodeEnv?.toLowerCase() === "production";
  const isAdmin = user?.role === USER_ROLE.ADMIN;

  // Debug log
  if (config.nodeEnv !== "test") {
    console.log(`[DEBUG] Transform: role=${user?.role}, isProduction=${isProduction}, isAdmin=${isAdmin}`);
  }

  // Internal helper to transform a single book object
  const transform = (item: any) => {
    if (!item) return item;

    // Add hasAudio boolean
    item.hasAudio = !!(item.audio?.secure_url);

    // Visibility logic
    const isPurchased = purchasedBookIds.some(
      (id) => id.toString() === item._id.toString()
    );

    const shouldShowAudio = !isProduction || isAdmin || isPurchased;

    if (config.nodeEnv !== "test") {
      console.log(`[DEBUG] Book: ${item.title}, isPurchased=${isPurchased}, shouldShowAudio=${shouldShowAudio}`);
    }

    if (!shouldShowAudio) {
      delete item.audio;
    }

    return item;
  };

  // Handle arrays or single objects
  if (Array.isArray(book)) {
    return book.map(transform);
  }
  return transform(book);
};

/**
 * Transforms a book object (or objects) and applies thumbnail resizing to the image URL.
 */
export const transformBookResponseWithThumbnail = (
  book: any,
  user: { id: string; role: string } | null,
  purchasedBookIds: string[] = []
) => {
  const transformed = transformBookResponse(book, user, purchasedBookIds);

  const applyThumbnail = (item: any) => {
    if (!item) return item;

    // Explicitly remove audio object for list views
    if (item.audio) {
      delete item.audio;
    }

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
