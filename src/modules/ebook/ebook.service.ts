import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { IEbook } from "./ebook.interface";
import { Ebook } from "./ebook.model";
import { Category } from "../ecategory/ecategory.model";

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
const getAllEbooksFromDB = async (query: { category?: string; formatType?: string }) => {
    const filter: Record<string, any> = {};

    if (query.category) {
        filter.category = query.category;
    }

    if (query.formatType) {
        filter.formatType = query.formatType;
    }

    // Fetch results and populate category fields seamlessly
    const result = await Ebook.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 });

    return result;
};

/**
 * Get a single Ebook by ID
 */
const getSingleEbookFromDB = async (ebookId: string): Promise<IEbook> => {
    const result = await Ebook.findById(ebookId).populate("category", "name slug");
    if (!result) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }
    return result;
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
 * Increment download metrics for a book safely
 */
const trackEbookDownloadInDB = async (ebookId: string): Promise<IEbook | null> => {
    const result = await Ebook.findByIdAndUpdate(
        ebookId,
        { $inc: { downloadCount: 1 } },
        { new: true }
    );
    if (!result) {
        throw new AppError("Ebook item not found", StatusCodes.NOT_FOUND);
    }
    return result;
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
};
