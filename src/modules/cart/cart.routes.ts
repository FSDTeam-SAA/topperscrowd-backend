import express from 'express';
import { CartController } from './cart.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { CartValidation } from './cart.validation';


const router = express.Router();

// Only authenticated users (Customers/Owners) can manage a cart
router.post(
    '/add-to-cart',
    auth(USER_ROLE.USER),
    validateRequest(CartValidation.addToCartZodSchema),
    CartController.addToCart
);

// Retrieve full cart
router.get(
    '/get-cart',
    auth(USER_ROLE.USER),
    CartController.getMyCart
);

// Update quantity of an item
router.patch(
    '/update-quantity',
    auth(USER_ROLE.USER),
    CartController.updateQuantity
);

// Remove specific item from cart
router.delete(
    '/clear-cart',
    auth(USER_ROLE.USER),
    CartController.clearCart
);

export const CartRouter = router;