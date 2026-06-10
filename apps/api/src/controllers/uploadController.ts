import { Request, Response, NextFunction } from 'express';
import { Image } from '../models/Image';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';

const getBaseUrl = () =>
  process.env.BASE_URL || 'http://52.66.123.200';

/* ─── Upload restaurant image ─────────────────────────────────────── */
export const uploadRestaurantImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      ownerId: req.user!._id,
    });
    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found or unauthorized' });
      return;
    }

    // Save image to Atlas
    const imgDoc = await Image.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedBy: req.user!._id,
      relatedId: restaurant._id,
      relatedType: 'restaurant',
    });

    const imageUrl = `${getBaseUrl()}/api/v1/images/${imgDoc._id}`;

    // Push URL into restaurant.images[]
    restaurant.images.push(imageUrl);
    await restaurant.save();

    res.status(201).json({ success: true, data: { imageUrl, imageId: imgDoc._id } });
  } catch (error) {
    next(error);
  }
};

/* ─── Upload menu-item image ──────────────────────────────────────── */
export const uploadMenuItemImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      ownerId: req.user!._id,
    });
    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found or unauthorized' });
      return;
    }

    const menuItem = await MenuItem.findOne({
      _id: req.params.itemId,
      restaurantId: req.params.restaurantId,
    });
    if (!menuItem) {
      res.status(404).json({ success: false, error: 'Menu item not found' });
      return;
    }

    // Delete old image doc if present
    if (menuItem.image) {
      const oldId = menuItem.image.split('/').pop();
      if (oldId) await Image.findByIdAndDelete(oldId).catch(() => { });
    }

    // Save new image to Atlas
    const imgDoc = await Image.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedBy: req.user!._id,
      relatedId: menuItem._id,
      relatedType: 'menuItem',
    });

    const imageUrl = `${getBaseUrl()}/api/v1/images/${imgDoc._id}`;

    menuItem.image = imageUrl;
    await menuItem.save();

    res.status(201).json({ success: true, data: { imageUrl, imageId: imgDoc._id } });
  } catch (error) {
    next(error);
  }
};

/* ─── Serve image by ID (public) ─────────────────────────────────── */
export const serveImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }
    // Allow cross-origin access so the frontend on :5173 can load images from :5000
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Content-Type', img.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(img.data);
  } catch (error) {
    next(error);
  }
};

/* ─── Upload restaurant UPI QR image (merchant only) ─────────────── */
export const uploadRestaurantUpiQr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      ownerId: req.user!._id,
    });
    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found or unauthorized' });
      return;
    }

    // Delete old QR image if one already exists
    if (restaurant.upiQrUrl) {
      const oldId = restaurant.upiQrUrl.split('/').pop();
      if (oldId) await Image.findByIdAndDelete(oldId).catch(() => { });
    }

    // Save new QR image to Atlas
    const imgDoc = await Image.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedBy: req.user!._id,
      relatedId: restaurant._id,
      relatedType: 'restaurant',
    });

    const imageUrl = `${getBaseUrl()}/api/v1/images/${imgDoc._id}`;

    restaurant.upiQrUrl = imageUrl;
    await restaurant.save();

    res.status(201).json({ success: true, data: { imageUrl, imageId: imgDoc._id } });
  } catch (error) {
    next(error);
  }
};
