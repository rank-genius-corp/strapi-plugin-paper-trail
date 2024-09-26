import { BaseHeaderLayout, Box } from '@strapi/design-system';
import { useQueryParams } from '@strapi/helper-plugin';
import React, { useEffect } from 'react';

import TrailRecordsTable from '../../components/TrailRecordsTable';
import useGetPaperTrails from '../../hooks/useGetPaperTrails';

const HomePage = () => {
  const [{ query: params } = {}, setQuery] = useQueryParams(null);
  const { data: { results: trails, pagination } = {}, isLoading } =
    useGetPaperTrails({
      params
    });

  useEffect(() => {
    if (params === null) {
      setQuery({
        page: 1,
        pageSize: 10,
        sort: 'updatedAt:asc',
      });
    }
  }, [params]);

  return (
    <Box background="neutral100" marginBottom={10}>
      <BaseHeaderLayout
        title="Paper Trail"
        subtitle={`${pagination?.total || 0} entries found`}
        as="h2"
      />
      <TrailRecordsTable
        trails={trails}
        pagination={pagination}
        loading={isLoading}
      />
    </Box>
  );
};

export default HomePage;
