import {
  BaseHeaderLayout,
  Box,
  Button,
  Flex,
  Link,
  LinkButton,
  Typography
} from '@strapi/design-system';
import { LoadingIndicatorPage, NoContent } from '@strapi/helper-plugin';
import { ArrowLeft, Check, Eye } from '@strapi/icons';
import set from 'lodash/fp/set';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import TrailChangedField from '../../components/TrailChangedField';
import useApplyTrail from '../../hooks/useApplyTrail';
import useContentTypes from '../../hooks/useContentTypes';
import useGetPaperTrail from '../../hooks/useGetPaperTrail';
import useUpdatePaperTrail from '../../hooks/useUpdatePaperTrail';
import pluginId from '../../pluginId';
import getTrailChangedFields from '../../utils/getTrailChangedFields';
import getTrailEntityName from '../../utils/getTrailEntityName';

const TrailPage = () => {
  const { id } = useParams();
  const { data: trail, isLoading: isLoadingTrail } = useGetPaperTrail({ id });
  const {
    contentTypes,
    componentTypes,
    contentTypesSettings,
    isLoading: isLoadingContentTypes
  } = useContentTypes();
  const { mutate: updatePaperTrail } = useUpdatePaperTrail();
  const { mutate: applyTrail } = useApplyTrail();
  const [fieldComments, setFieldComments] = useState({});

  useEffect(() => {
    if (trail && trail.fieldComments) {
      setFieldComments(trail.fieldComments);
    }
  }, [trail]);

  const changedFields = useMemo(() => {
    if (!trail || !contentTypes || !componentTypes || isLoadingContentTypes)
      return;

    return getTrailChangedFields({
      trail,
      components: componentTypes,
      contentTypes
    });
  }, [trail, contentTypes, componentTypes, isLoadingContentTypes]);

  const handleCommentChange = (path, value) => {
    setFieldComments(set(path, value, fieldComments));
  };

  const handleRequestChanges = () => {
    updatePaperTrail({
      id,
      data: {
        fieldComments,
        status: 'changes_required'
      }
    });
  };

  const isLoading = isLoadingContentTypes || isLoadingTrail;

  if (isLoading) return <LoadingIndicatorPage />;

  if (!isLoadingTrail && !trail) {
    return (
      <Box padding={8} background="neutral100">
        <NoContent />
      </Box>
    );
  }

  const schema = contentTypes?.find(type => type.uid === trail.contentType);

  const handleApplyTrail = () => {
    applyTrail({ trail, schema });
  };

  const getUserFullName = user =>
    user ? `${user.firstname} ${user.lastname}` : undefined;

  const trailBy = getUserFullName(trail.admin_user);
  const lastChangeBy = getUserFullName(trail.updatedBy);

  const isSingleEntity = schema?.kind === 'singleType';
  const entityUrl = `/content-manager/${schema?.kind}/${trail.contentType}${
    isSingleEntity ? '' : `/${trail.recordId}`
  }`;

  return (
    <div>
      <Box background="neutral100">
        <BaseHeaderLayout
          navigationAction={
            <Link startIcon={<ArrowLeft />} to={`/plugins/${pluginId}`}>
              Go back
            </Link>
          }
          primaryAction={
            <Flex gap={2}>
              <Button variant="secondary" onClick={handleRequestChanges}>
                Comment and reprove
              </Button>
              <Button startIcon={<Check />} onClick={handleApplyTrail}>
                Approve {trail.change === 'DRAFT' && <>and apply changes</>}
              </Button>
            </Flex>
          }
          secondaryAction={
            <LinkButton
              size="S"
              variant="tertiary"
              startIcon={<Eye />}
              to={entityUrl}
              target="_blank"
            >
              View entity
            </LinkButton>
          }
          title={`Paper Trail of ${getTrailEntityName({
            trail,
            contentTypesSettings
          })}`}
          subtitle={`${trail.change} - Version ${
            trail.version
          } by ${trailBy} - Last updated by ${lastChangeBy || '-'}`}
          as="h2"
        />
      </Box>
      <Box paddingLeft={10} paddingRight={10}>
        <Box
          hasRadius
          background="neutral0"
          shadow="tableShadow"
          paddingLeft={6}
          paddingRight={6}
          paddingTop={6}
          paddingBottom={6}
          marginBottom={6}
          borderColor="neutral150"
        >
          {isEmpty(changedFields) ? (
            <Typography>No diffs to display</Typography>
          ) : (
            <Flex direction="column" gap={6} alignItems="stretch">
              {changedFields &&
                Object.entries(changedFields).map(([key, value]) => (
                  <TrailChangedField
                    key={`${key}-field`}
                    path={key}
                    value={value}
                    oldValue={trail.previousContent[key]}
                    schema={schema}
                    componentTypes={componentTypes}
                    comments={fieldComments}
                    handleCommentChange={handleCommentChange}
                  />
                ))}
            </Flex>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default TrailPage;
