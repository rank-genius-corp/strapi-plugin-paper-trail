import { useFetchClient } from '@strapi/helper-plugin';
import qs from 'qs';
import { useQuery } from 'react-query';

export default function useGetPaperTrails({ params }) {
  const { get } = useFetchClient();
  const query = useQuery(['paper-trails', params], async () => {
    const parsedParams = qs.stringify(params, { encodeValuesOnly: true });

    const { data = {} } = await get(
      `/content-manager/collection-types/plugin::paper-trail.trail?${parsedParams}`
    );
    const { results = [], pagination } = data;

    return { results, pagination };
  });

  return query;
}
