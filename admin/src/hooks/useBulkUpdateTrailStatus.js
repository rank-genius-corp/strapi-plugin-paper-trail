import {
  useAPIErrorHandler,
  useFetchClient,
  useNotification
} from '@strapi/helper-plugin';
import { isAxiosError } from 'axios';
import { useMutation } from 'react-query';

export default function useBulkUpdateTrailStatus() {
  const { put } = useFetchClient();
  const { formatAPIError } = useAPIErrorHandler();
  const toggleNotification = useNotification();

  return useMutation({
    mutationFn: ({ trailIds, status }) => {
      return Promise.all(
        trailIds.map(id =>
          put(
            `/content-manager/collection-types/plugin::paper-trail.trail/${id}`,
            { status }
          )
        )
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
        message: 'Paper Trails successfully updated'
      });
      location.reload();
    },
  });
}
