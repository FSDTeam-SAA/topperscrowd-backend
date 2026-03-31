import { model, Schema } from "mongoose";
import { IBook } from "./book.interface";
import BookCategory from "../bookCategory/bookCategory.model";

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: Schema.Types.ObjectId, ref: "BookCategory", required: true },
    price: { type: Number, required: true },
    language: { type: String, required: true },
    reviews: { type: [Schema.Types.ObjectId], ref: "Review" },
    // reviews: { type: [String], required: true },
    saleCount: { type: Number },
    publisher: { type: String, required: true },
    publicationYear: { type: Number, required: true },
    image: {
      public_id: String,
      secure_url: String,
    },
    audio: {
      public_id: String,
      secure_url: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);


//pre middleware for check is genere is exist or not
bookSchema.pre("save", async function (next) {
  const genreId = this.genre;
  const genreExists = await BookCategory.exists({ _id: genreId });
  if (!genreExists) {
    return next(new Error("This genre does not exist"));
  }
  next();
});

//pre middleware for check is genere is exist or not
bookSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as Record<string, any>;
  if (update.genre) {
    const genreId = update.genre;
    const genreExists = await BookCategory.exists({ _id: genreId });
    if (!genreExists) {
      return next(new Error("This genre does not exist"));
    }
  }
  next();
});

const Book = model<IBook>("Book", bookSchema);

export default Book;
