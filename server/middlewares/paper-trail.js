const checkContext = require('../utils/checkContext');
const allowedStatuses = require('../utils/allowedStatuses');

module.exports = async (ctx, next) => {
  try {
    const { uid, recordId, schema, isAdmin, change } = checkContext(ctx);

    if (!schema) {
      return next();
    }

    const previousContent = await findEntity(recordId, uid);

    await next();

    /**
     * Try/Catch so we don't totally mess with the admin panel if something is wrong
     */

    try {
      const { status } = ctx.response;

      const allowedStatusCheck = allowedStatuses.includes(status);

      if (!allowedStatusCheck) {
        return;
      }

      /**
       * If we have a returned schema, check it for paperTrail.enabled
       */

      const { pluginOptions } = schema;

      const enabled = pluginOptions?.paperTrail?.enabled;

      if (enabled) {
        /**
         * Intercept the body and take a snapshot of the change
         */

        const paperTrailService = strapi
          .plugin('paper-trail')
          .service('paperTrailService');

        await paperTrailService.createPaperTrail(
          ctx,
          schema,
          uid,
          change,
          previousContent,
          isAdmin
        );
      }
    } catch (Err) {
      console.warn('paper-trail: ', Err);
    }
  } catch (Err) {
    console.warn('paper-trail: ', Err);
    await next();
  }
};

const findEntity = async (recordId, uid) => {
  const entityManager = strapi
    .plugin('content-manager')
    .service('entity-manager');

  const populate = await strapi
    .plugin('content-manager')
    .service('populate-builder')(uid)
    .populateDeep(Infinity)
    .countRelations()
    .build();

  const value = await entityManager.findOne(recordId, uid, { populate });

  if (!value) {
    return null;
  }

  const { createdBy, updatedBy, ...rest } = value;

  return {
    ...rest,
    createdBy: {
      id: createdBy?.id
    },
    updatedBy: {
      id: createdBy?.id
    }
  };
};
