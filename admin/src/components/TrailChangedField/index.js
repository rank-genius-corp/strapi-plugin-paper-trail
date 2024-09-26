import {
  Box,
  Divider,
  FieldLabel,
  Flex,
  Grid,
  TextInput,
  Textarea
} from '@strapi/design-system';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import React from 'react';

import MediaField from './MediaField';
import RelationField from './RelationField';

const IGNORE_FIELDS = ['id'];
const TEXTAREA_TYPES = ['text', 'richtext', 'json'];

const TrailChangedField = ({
  level = 0,
  path,
  pathToParent = '',
  value,
  oldValue,
  schema,
  componentTypes,
  comments,
  handleCommentChange
}) => {
  if (IGNORE_FIELDS.includes(path) || path.startsWith('__')) return;

  const type = get(schema, ['attributes', path, 'type'], '');
  const fullPath = pathToParent ? [pathToParent, path].join('.') : path;

  const onCommentChange = handleCommentChange
    ? event => {
        handleCommentChange(fullPath, event.target.value);
      }
    : undefined;

  if (type === 'component') {
    const component = get(schema, ['attributes', path, 'component'], '');
    const componentType = componentTypes?.find(type => type.uid === component);
    const isRepeatable = get(schema, ['attributes', path, 'repeatable'], '');

    return (
      <Wrapper hideComment label={path} level={level}>
        <Flex gap={2} direction="column" alignItems="stretch">
          {isRepeatable
            ? value.map((newValue, index) =>
                isEmpty(newValue) ? null : (
                  <Wrapper
                    hideComment
                    label={`Item ${index + 1}`}
                    level={level + 1}
                  >
                    <Flex gap={6} direction="column" alignItems="stretch">
                      {Object.entries(newValue).map(([key, value]) => (
                        <TrailChangedField
                          key={key}
                          level={level + 2}
                          path={key}
                          pathToParent={path}
                          value={value}
                          oldValue={oldValue?.[index]?.[key]}
                          schema={componentType}
                          comments={comments}
                          handleCommentChange={handleCommentChange}
                        />
                      ))}
                    </Flex>
                  </Wrapper>
                )
              )
            : Object.entries(value).map(([key, value]) => (
                <TrailChangedField
                  key={key}
                  level={level + 1}
                  path={key}
                  pathToParent={path}
                  value={value}
                  oldValue={oldValue?.[key]}
                  schema={componentType}
                  comments={comments}
                  handleCommentChange={handleCommentChange}
                />
              ))}
        </Flex>
      </Wrapper>
    );
  }

  if (type === 'dynamiczone') {
    return (
      <Wrapper hideComment label={path} level={level}>
        <Flex gap={6} direction="column" alignItems="stretch">
          {value.map((newValue, index) => {
            if (isEmpty(newValue)) return;

            const componentType = componentTypes?.find(
              type => type.uid === newValue.__component
            );

            return (
              <Wrapper
                hideComment
                label={`Item ${index + 1} (${componentType.info.displayName})`}
                level={level + 1}
              >
                <Flex gap={2} direction="column" alignItems="stretch">
                  {Object.entries(newValue).map(([key, value]) => (
                    <TrailChangedField
                      key={key}
                      level={level + 2}
                      path={key}
                      pathToParent={''}
                      value={value}
                      oldValue={oldValue?.[index]?.[key]}
                      schema={componentType}
                      componentTypes={componentTypes}
                      comments={comments}
                      handleCommentChange={handleCommentChange}
                    />
                  ))}
                </Flex>
              </Wrapper>
            );
          })}
        </Flex>
      </Wrapper>
    );
  }

  if (type === 'relation') {
    const target = get(schema, ['attributes', path, 'targetModel']);

    return (
      <Wrapper
        label={path}
        level={level}
        fullPath={fullPath}
        comment={get(comments, fullPath, null)}
        onCommentChange={onCommentChange}
      >
        <RelationField value={value} targetContentType={target} />
      </Wrapper>
    );
  }

  if (type === 'media') {
    const multiple = get(schema, ['attributes', path, 'multiple'], '');

    return (
      <Wrapper
        label={path}
        level={level}
        fullPath={fullPath}
        comment={get(comments, fullPath, null)}
        onCommentChange={onCommentChange}
      >
        <MediaField value={value} oldValue={oldValue} multiple={multiple} />
      </Wrapper>
    );
  }

  const mapValue = v => (isObject(v) ? JSON.stringify(v) : v?.toString() || '');

  const Input = TEXTAREA_TYPES.includes(type) ? Textarea : TextInput;

  return (
    <Wrapper
      label={path}
      level={level}
      fullPath={fullPath}
      comment={get(comments, fullPath, null)}
      onCommentChange={onCommentChange}
    >
      <Grid gap={2} gridCols={2} alignItems="center">
        <Input aria-label="Previous value" value={mapValue(oldValue)} readOnly />
        <Input aria-label="New value" value={mapValue(value)} readOnly />
      </Grid>
    </Wrapper>
  );
};

const Wrapper = ({
  children,
  hideComment,
  label,
  level,
  fullPath,
  onCommentChange,
  comment
}) => (
  <div>
    <FieldLabel>{label} (left previous value/right new value)</FieldLabel>
    <Box
      hasRadius
      background={level % 2 === 0 ? 'neutral100' : 'neutral0'}
      shadow="tableShadow"
      paddingLeft={2}
      paddingRight={2}
      marginTop={1}
      paddingTop={2}
      paddingBottom={2}
      borderColor="neutral150"
    >
      {children}
      {!hideComment && onCommentChange && (
        <>
          <Box paddingTop={4} paddingBottom={4}>
            <Divider />
          </Box>
          <Textarea
            name={fullPath}
            label="Comment"
            value={comment || ''}
            onChange={onCommentChange}
          />
        </>
      )}
    </Box>
  </div>
);

export default TrailChangedField;
