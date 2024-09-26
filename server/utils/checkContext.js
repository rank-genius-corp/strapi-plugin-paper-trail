const allowedMethods = require('./allowedMethods');
const getContentTypeSchema = require('./getContentTypeSchema');
const getPathParams = require('./getPathParams');
const matchAdminPath = require('./matchAdminPath');
const matchApiPath = require('./matchApiPath');
const getChangeType = require('./getChangeType');

module.exports = context => {
  const { method, url } = context.request;

  /**
   * We have a few things to check here. We're only interested in:
   * - POST | PUT | DELETE methods
   * - Routes that match a regex (admin content type endpoint or content type generated endpoint)
   */

  const allowedMethodsCheck = allowedMethods.includes(method);
  const adminMatchCheck = Boolean(matchAdminPath(url));
  const apiMatchCheck = Boolean(matchApiPath(url));

  if (allowedMethodsCheck && (adminMatchCheck || apiMatchCheck)) {
    const params = getPathParams(url, adminMatchCheck);

    const { contentTypeName, contentTypeId } = params;

    const schema = getContentTypeSchema(contentTypeName, adminMatchCheck);

    if (!schema) {
      return { contentTypeName: null, contentTypeId: null, schema: null };
    }

    const uid = schema.uid;
    const change = getChangeType(method);

    return {
      schema,
      uid,
      recordId: contentTypeId,
      isAdmin: adminMatchCheck,
      change
    };
  }

  return { contentTypeName: null, schema: null };
};
