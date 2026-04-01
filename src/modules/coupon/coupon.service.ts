import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { Coupon } from "./coupon.model";
import sendEmail from "../../utils/sendEmail";

const createCoupon = async (payload: {
  email: string;
  codeName: string;
  expiryDate: string;
  usesLimit: number;
  discountType: "flat" | "percentage";
  discountAmount: number;
}) => {
  // 1. Find user by email
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw new AppError("No user found with the provided email", httpStatus.NOT_FOUND);
  }

  // 2. Check for duplicate coupon code globally
  const existingCoupon = await Coupon.findOne({ codeName: payload.codeName });
  if (existingCoupon) {
    throw new AppError("A coupon with this code already exists", httpStatus.BAD_REQUEST);
  }

  // 3. Create the coupon assigned to the specific user
  const coupon = await Coupon.create({
    codeName: payload.codeName,
    assignedTo: user._id,
    expiryDate: new Date(payload.expiryDate),
    usesLimit: payload.usesLimit,
    discountType: payload.discountType,
    discountAmount: payload.discountAmount,
  });

  // 4. Send email notification to user
  const discountText = payload.discountType === 'percentage' 
    ? `${payload.discountAmount}% off` 
    : `$${payload.discountAmount} off`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">You have received a Special Coupon!</h2>
        <p style="color: #555; font-size: 16px;">Hello ${user.firstName},</p>
        <p style="color: #555; font-size: 16px;">We are excited to share a special discount coupon with you at ToppersCrowd.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #888;">Your Private Coupon Code</p>
            <h3 style="margin: 10px 0 0; font-size: 24px; color: #2ecc71; letter-spacing: 2px;">${coupon.codeName}</h3>
        </div>

        <ul style="color: #555; font-size: 15px; background: #fff; padding: 15px 15px 15px 35px; border-radius: 5px; border: 1px dashed #ccc;">
            <li><strong>Discount:</strong> ${discountText}</li>
            <li><strong>Valid Until:</strong> ${new Date(coupon.expiryDate).toLocaleDateString()}</li>
            <li><strong>Usage Limits:</strong> Valid for ${coupon.usesLimit} purchases</li>
        </ul>

        <p style="color: #555; font-size: 16px;">Use this code during the checkout process to receive your discount!</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Shop Now</a>
        </div>
        
        <br>
        <p style="color: #999; font-size: 12px; text-align: center;">This coupon is strictly bound to your account email and cannot be shared.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "🎁 You received a Special Discount Coupon! - ToppersCrowd",
    html: htmlTemplate,
  });

  return coupon;
};

const getMyCoupons = async (userId: string) => {
  // Fetch active coupons mapped to the user
  const coupons = await Coupon.find({ 
    assignedTo: userId,
    $expr: { $lt: ["$usedCount", "$usesLimit"] },
    expiryDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  return coupons;
};

export const CouponService = {
  createCoupon,
  getMyCoupons
};
