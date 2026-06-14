import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { USER_ROLE } from "../user/user.constant";
import { IEbook } from "./ebook.interface";
import { Ebook } from "./ebook.model";
import { Category } from "../ecategory/ecategory.model";
import { Order } from "../order/order.model";

const getPurchasedEbookIds = async (userId?: string) => {
    if (!userId) return [];
    const purchased = await Order.find({
        userId,
        paymentStatus: "paid",
    }).distinct("items.ebook");
    return (purchased as any).filter(Boolean).map((id: any) => id.toString());
};

export const transformEbookResponse = (
    ebook: any,
    user: JwtPayload | { id?: string; role?: string } | null = null,
    purchasedEbookIds: string[] = []
) => {
    const isAdmin = user?.role === USER_ROLE.ADMIN;

    const transform = (item: any) => {
        if (!item) return item;
        const plainItem = typeof item.toObject === "function" ? item.toObject() : item;
        const isPurchased = purchasedEbookIds.some(
            (id) => id.toString() === plainItem._id.toString()
        );
        const shouldShowFile = !plainItem.isPremium || isAdmin || isPurchased;

        plainItem.hasFile = !!plainItem.file?.url;

        if (!shouldShowFile) {
            delete plainItem.file;
        }

        return plainItem;
    };

    if (Array.isArray(ebook)) {
        return ebook.map(transform);
    }

    return transform(ebook);
};

/**
 * Validate a new Ebook/Epub entry before expensive file uploads
 */
const validateEbookCreate = async (payload: Partial<IEbook>) => {
    const isCategoryExist = await Category.findById(payload.category);
    if (!isCategoryExist) {
        throw new AppError("Referenced category does not exist", StatusCodes.NOT_FOUND);
    }

    const isSlugExist = await Ebook.findOne({ slug: payload.slug });
    if (isSlugExist) {
        throw new AppError("An ebook with this slug already exists", StatusCodes.CONFLICT);
    }
};

/**
 * Validate an Ebook update before expensive file uploads
 */
const validateEbookUpdate = async (
    ebookId: string,
    payload: Partial<IEbook>
): Promise<IEbook> => {
    const existingEbook = await Ebook.findById(ebookId);
    if (!existingEbook) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }

    if (payload.category) {
        const isCategoryExist = await Category.findById(payload.category);
        if (!isCategoryExist) {
            throw new AppError("Referenced category does not exist", StatusCodes.NOT_FOUND);
        }
    }

    if (payload.slug) {
        const isSlugExist = await Ebook.findOne({
            slug: payload.slug,
            _id: { $ne: ebookId },
        });
        if (isSlugExist) {
            throw new AppError("An ebook with this slug already exists", StatusCodes.CONFLICT);
        }
    }

    return existingEbook;
};

/**
 * Create a new Ebook/Epub entry after verifying the category exists
 */
const createEbookIntoDB = async (payload: IEbook): Promise<IEbook> => {
    await validateEbookCreate(payload);
    const result = await Ebook.create(payload);
    return result;
};

/**
 * Get ebooks with flexible filtering via runtime query structures
 */
const getAllEbooksFromDB = async (query: { category?: string; formatType?: string; status?: string }) => {
    const filter: Record<string, any> = {};

    if (query.category) {
        filter.category = query.category;
    }

    if (query.formatType) {
        filter.formatType = query.formatType;
    }

    if (query.status && query.status !== "all") {
        filter.status = query.status;
    }

    const result = await Ebook.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .lean();

    return transformEbookResponse(result);
};

/**
 * Get a single Ebook by ID
 */
const getSingleEbookFromDB = async (ebookId: string): Promise<IEbook> => {
    const result = await Ebook.findById(ebookId).populate("category", "name slug").lean();
    if (!result) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }
    return transformEbookResponse(result);
};

/**
 * Update Ebook configurations
 */
const updateEbookInDB = async (ebookId: string, payload: Partial<IEbook>): Promise<IEbook | null> => {
    await validateEbookUpdate(ebookId, payload);

    const result = await Ebook.findByIdAndUpdate(ebookId, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

/**
 * Delete an Ebook from DB (Returns data so controller can run Cloudinary cleanup)
 */
const deleteEbookFromDB = async (ebookId: string): Promise<IEbook | null> => {
    const isEbookExist = await Ebook.findById(ebookId);
    if (!isEbookExist) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }

    const result = await Ebook.findByIdAndDelete(ebookId);
    return result;
};

/**
 * Increment download metrics after confirming the requester may access the file.
 */
const trackEbookDownloadInDB = async (ebookId: string, user: JwtPayload): Promise<IEbook | null> => {
    const ebook = await Ebook.findById(ebookId);
    if (!ebook) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }

    const purchasedEbookIds = await getPurchasedEbookIds(user.id);
    const canDownload = !ebook.isPremium || user.role === USER_ROLE.ADMIN || purchasedEbookIds.includes(ebookId);

    if (!canDownload) {
        throw new AppError("You need to purchase this ebook before downloading it", StatusCodes.FORBIDDEN);
    }

    const result = await Ebook.findByIdAndUpdate(
        ebookId,
        { $inc: { downloadCount: 1 } },
        { new: true }
    ).populate("category", "name slug");

    return transformEbookResponse(result, user, purchasedEbookIds);
};

export const ebookService = {
    validateEbookCreate,
    validateEbookUpdate,
    createEbookIntoDB,
    getAllEbooksFromDB,
    getSingleEbookFromDB,
    updateEbookInDB,
    deleteEbookFromDB,
    trackEbookDownloadInDB,
    getPurchasedEbookIds,
    transformEbookResponse,
};
