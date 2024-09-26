'use strict';

const middlewares = require('./middlewares');
const userPermissionSchema = require('./content-types/trail/user-permissions');

module.exports = async ({ strapi }) => {
  // during boot, check if the user-permissions plugin exists
  const userPermissionsContentType = strapi.contentType(
    'plugin::users-permissions.user'
  );

  if (userPermissionsContentType) {
    // if the user permissions plugin is installed, bind the trails directly to the user
    const trailContentType = strapi.contentType('plugin::paper-trail.trail');

    trailContentType.attributes = {
      // Spread previous defined attributes
      ...trailContentType.attributes,
      // Add new attribute
      ...userPermissionSchema
    };
  }

  strapi.server.use(middlewares.paperTrailMiddleware);

  await registerPermissions();
};

const registerPermissions = async () => {
  const permissions = [
    {
      section: 'plugins',
      displayName: 'Show on sidebar',
      uid: 'sidebar',
      subCategory: 'paper-trail',
      pluginName: 'paper-trail'
    }
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(permissions);
};
