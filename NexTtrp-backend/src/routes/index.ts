import { Router } from 'express';
import { adminRouter } from './admin';
import { bookingsRouter } from './bookings';
import { categoriesRouter } from './categories';
import { healthRouter } from './health';
import { locationsRouter } from './locations';
import { notificationsRouter } from './notifications';
import { packagesRouter } from './packages';
import { paymentsRouter } from './payments';
import { reviewsRouter } from './reviews';
import { usersRouter } from './users';
import { vendorRouter } from './vendor';
import { wishlistRouter } from './wishlist';

/**
 * Versioned API v1 route aggregator.
 */
export const apiV1Router = Router();

apiV1Router.use('/health', healthRouter);
apiV1Router.use('/packages', packagesRouter);
apiV1Router.use('/wishlist', wishlistRouter);
apiV1Router.use('/users', usersRouter);
apiV1Router.use('/locations', locationsRouter);
apiV1Router.use('/categories', categoriesRouter);
apiV1Router.use('/bookings', bookingsRouter);
apiV1Router.use('/notifications', notificationsRouter);
apiV1Router.use('/reviews', reviewsRouter);
apiV1Router.use('/admin', adminRouter);
apiV1Router.use('/vendor', vendorRouter);
apiV1Router.use('/payments', paymentsRouter);
