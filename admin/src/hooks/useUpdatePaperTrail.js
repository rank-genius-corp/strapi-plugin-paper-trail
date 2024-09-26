import {
  useAPIErrorHandler,
  useFetchClient,
  useNotification
} from '@strapi/helper-plugin';
import { isAxiosError } from 'axios';
import { useMutation } from 'react-query';

export default function useUpdatePaperTrail() {
  const { put } = useFetchClient();
  const { formatAPIError } = useAPIErrorHandler();
  const toggleNotification = useNotification();

  return useMutation({
    mutationFn: ({ id, data }) => {
      return put(
        `/content-manager/collection-types/plugin::paper-trail.trail/${id}`,
        data
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
        message: 'Paper Trail updated'
      });
    }
  });
}
