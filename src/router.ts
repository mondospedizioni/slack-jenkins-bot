import Router from 'koa-router';
import * as routes from '@app/routes';

const router = new Router();

router.use('/', routes.homeRoutes.routes(), routes.homeRoutes.allowedMethods());
router.use('/v1/monitors', routes.monitorRoutes.routes(), routes.monitorRoutes.allowedMethods());

export default router;
