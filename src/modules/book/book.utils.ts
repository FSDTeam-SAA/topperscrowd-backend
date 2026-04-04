import config from "../../config";
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
  const isProduction = config.nodeEnv === "production";
  const isAdmin = user?.role === USER_ROLE.ADMIN;
  
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
