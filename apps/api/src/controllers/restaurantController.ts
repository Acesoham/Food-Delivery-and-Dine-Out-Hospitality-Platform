import { Request, Response, NextFunction } from 'express';
import * as restaurantService from '../services/restaurantService';

export const discover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await restaurantService.discoverRestaurants((req as any).validatedQuery);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await restaurantService.getRestaurantById((req.params.id as string));
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: restaurant });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      (req.params.id as string),
      req.user!._id.toString(),
      req.body
    );
    res.json({ success: true, data: restaurant });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await restaurantService.getRestaurantById((req.params.id as string));
    res.json({ success: true, data: result.menuItems });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const addMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await restaurantService.addMenuItem((req.params.id as string), req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await restaurantService.updateMenuItem(
      (req.params.id as string),
      (req.params.itemId as string),
      req.user!._id.toString(),
      req.body
    );
    res.json({ success: true, data: item });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await restaurantService.deleteMenuItem((req.params.id as string), (req.params.itemId as string), req.user!._id.toString());
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
};

export const getMyRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants = await restaurantService.getMerchantRestaurants(req.user!._id.toString());
    res.json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
};
