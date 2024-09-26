import {
  useAPIErrorHandler,
  useFetchClient,
  useNotification
} from '@strapi/helper-plugin';
import { isAxiosError } from 'axios';
import { useMutation } from 'react-query';

export default function useApplyTrail() {
  const { put } = useFetchClient();
  const { formatAPIError } = useAPIErrorHandler();
  const toggleNotification = useNotification();

  return useMutation({
    mutationFn: async ({ trail, schema }) => {
      const { recordId, content, change } = trail;
      const { uid, kind } = schema;
      const isSingleType = kind === 'singleType';
      const typePath = isSingleType ? 'single-types' : 'collection-types';

      if (change === 'DRAFT') {
        await put(
          `/content-manager/${typePath}/${uid}${
            isSingleType ? '' : `/${recordId}`
          }`,
          content
        );
      }

      return put(
        `/content-manager/collection-types/plugin::paper-trail.trail/${trail.id}`,
        { status: 'approved' }
      );
    },
    onError(error) {
      if (isAxiosError(error)) {
        toggleNotification({
          type: 'warning',
          message: formatAPIError(error)
        });
      }
    },
    onSuccess() {
      toggleNotification({
        type: 'success',
        message: 'Paper Trail approved successfully'
      });
    }
  });
}
