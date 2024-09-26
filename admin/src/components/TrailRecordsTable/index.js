import {
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  LinkButton,
  SearchForm,
  Searchbar,
  Status,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden
} from '@strapi/design-system';
import {
  EmptyBodyTable,
  PaginationURLQuery,
  useQueryParams
} from '@strapi/helper-plugin';
import { Check, Cross, Eye } from '@strapi/icons';
import set from 'lodash/fp/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

import useBulkUpdateTrailStatus from '../../hooks/useBulkUpdateTrailStatus';
import useContentTypes from '../../hooks/useContentTypes';
import pluginId from '../../pluginId';
import getTrailChangedFields from '../../utils/getTrailChangedFields';
import getTrailEntityName from '../../utils/getTrailEntityName';
import TrailChangedField from '../TrailChangedField';
import EditorSelect from './EditorSelect';
import Tabs from './Tabs';

const COLUMNS_COUNT = 10;

export default function TrailRecordsTable({ trails, pagination, loading }) {
  const { value: searchTerm, updateValue: handleSearch } =
    useQueryParamsFilters(['content', '$containsi']);
  const { value: selectedTab, updateValue: handleSelectTab } =
    useQueryParamsFilters(['status', '$eq']);
  const { value: selectedEditor, updateValue: handleSelectEditor } =
    useQueryParamsFilters(['admin_user', 'id', '$eq']);
  const [{ query: params } = {}, setQuery] = useQueryParams({
    hideChanges: false,
    filters: []
  });
  const [search, setSearch] = useState(searchTerm);
  const [selectedTrailIds, setSelectedTrailIds] = useState([]);
  const { mutate: bulkUpdateTrails } = useBulkUpdateTrailStatus();

  const hasFilters = !!params.filters;
  const hideChanges = params.hideChanges === 'true';
  const columnsCount = hideChanges ? COLUMNS_COUNT - 1 : COLUMNS_COUNT;

  const allTrailsSelected =
    selectedTrailIds.length > 0 && selectedTrailIds.length === trails?.length;

  const bulkUpdate = status =>
    bulkUpdateTrails({ trailIds: selectedTrailIds, status });

  return (
    <Box paddingLeft={10} paddingRight={10} background="neutral100">
      <Box marginBottom={4}>
        <Flex marginBottom={2} justifyContent="space-between">
          <Tabs handleSelect={handleSelectTab} selected={selectedTab} />
          <Flex gap={2} alignItems="flex-end">
            <SearchForm
              onSubmit={e => {
                e.preventDefault();
                handleSearch(search);
              }}
            >
              <Searchbar
                onClear={() => {
                  setSearch('');
                  handleSearch(undefined);
                }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                clearLabel="Clear search"
                placeholder="Search"
              >
                Search
              </Searchbar>
            </SearchForm>
            <EditorSelect
              value={selectedEditor}
              setValue={handleSelectEditor}
            />
          </Flex>
        </Flex>
        <Flex gap={4}>
          <Checkbox
            value={hideChanges}
            onValueChange={value => setQuery({ hideChanges: value })}
          >
            Hide changes
          </Checkbox>
          {hasFilters && (
            <LinkButton
              size="S"
              variant="secondary"
              to={`/plugins/${pluginId}`}
            >
              Clear filters
            </LinkButton>
          )}
        </Flex>
        {!!selectedTrailIds?.length && (
          <Flex marginTop={2} gap={2}>
            <Typography variant="omega" textColor="neutral500">
              {selectedTrailIds.length} entries selected
            </Typography>
            <Button
              variant="success-light"
              onClick={() => bulkUpdate(TRAIL_STATUS.APPROVED)}
              startIcon={<Check />}
            >
              Approve
            </Button>
            <Button
              variant="danger-light"
              onClick={() => bulkUpdate(TRAIL_STATUS.REPROVED)}
              startIcon={<Cross />}
            >
              Reprove
            </Button>
          </Flex>
        )}
      </Box>
      <Table colCount={columnsCount} rowCount={trails?.length || 0}>
        <Thead>
          <Tr>
            <Th>
              <Checkbox
                aria-label="Select all entries"
                value={allTrailsSelected}
                onValueChange={() =>
                  setSelectedTrailIds(
                    allTrailsSelected ? [] : trails.map(trail => trail.id)
                  )
                }
              />
            </Th>
            <Th>
              <Typography variant="sigma">ID</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Type</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Version</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Editor</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Updated At</Typography>
            </Th>
            {!hideChanges && (
              <Th>
                <Typography variant="sigma">Changes</Typography>
              </Th>
            )}
            <Th>
              <Typography variant="sigma">Status</Typography>
            </Th>
            <Th>
              <VisuallyHidden>Actions</VisuallyHidden>
            </Th>
          </Tr>
        </Thead>
        {!trails || trails?.length === 0 ? (
          <EmptyBodyTable colSpan={columnsCount} isLoading={loading} />
        ) : (
          <Tbody>
            {trails?.map(entry => (
              <TableItem
                key={entry.id}
                trail={entry}
                hideChanges={hideChanges}
                selected={selectedTrailIds.includes(entry.id)}
                onSelect={selected =>
                  setSelectedTrailIds(
                    selected
                      ? [...selectedTrailIds, entry.id]
                      : selectedTrailIds.filter(id => id !== entry.id)
                  )
                }
                onUpdateStatus={newStatus =>
                  bulkUpdateTrails({
                    trailIds: [entry.id],
                    status: newStatus
                  })
                }
              />
            ))}
          </Tbody>
        )}
      </Table>
      {pagination && (
        <Flex justifyContent="end" marginTop={4}>
          <PaginationURLQuery pagination={pagination} />
        </Flex>
      )}
    </Box>
  );
}

const TableItem = ({
  trail,
  selected,
  onSelect,
  onUpdateStatus,
  hideChanges
}) => {
  const {
    contentTypesSettings,
    contentTypes,
    componentTypes,
    isLoading: isLoadingContentTypes
  } = useContentTypes();

  const changedFields = useMemo(() => {
    if (!trail || !contentTypes || !componentTypes || isLoadingContentTypes)
      return;

    return getTrailChangedFields({
      trail,
      components: componentTypes,
      contentTypes
    });
  }, [trail, contentTypes, componentTypes, isLoadingContentTypes]);

  const schema = contentTypes?.find(type => type.uid === trail.contentType);

  const getContentTypeName = uid => {
    if (!contentTypes?.length) return uid;

    const contentType = contentTypes.find(type => type.uid === uid);

    return contentType?.info?.displayName || uid;
  };

  return (
    <Tr>
      <Th>
        <Checkbox
          aria-label={`Select trail ${trail.id}`}
          value={selected}
          onValueChange={onSelect}
        />
      </Th>
      <Td>
        <Typography textColor="neutral800">{trail.id}</Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">
          {getContentTypeName(trail.contentType)}
        </Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">
          {getTrailEntityName({ trail, contentTypesSettings })}
        </Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">{trail.version}</Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">
          {trail.admin_user?.firstname} {trail.admin_user?.lastname}
        </Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">
          {new Date(trail.updatedAt).toLocaleString()}
        </Typography>
      </Td>
      {!hideChanges && (
        <Td>
          {trail.change === 'DELETE' ? (
            <Typography>Entity deleted</Typography>
          ) : isEmpty(changedFields) ? (
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
                  />
                ))}
            </Flex>
          )}
        </Td>
      )}
      <Td>
        <Flex>
          <TrailStatus status={trail.status} />
        </Flex>
      </Td>
      <Td>
        <Flex>
          <NavLink to={`/plugins/${pluginId}/${trail.id}`}>
            <IconButton icon={<Eye />} label="View trail" borderWidth={0} />
          </NavLink>
          <IconButton
            icon={<Check />}
            label="Approve"
            borderWidth={0}
            onClick={() => onUpdateStatus(TRAIL_STATUS.APPROVED)}
          />
          <IconButton
            icon={<Cross />}
            label="Reprove"
            borderWidth={0}
            onClick={() => onUpdateStatus(TRAIL_STATUS.REPROVED)}
          />
        </Flex>
      </Td>
    </Tr>
  );
};

const TRAIL_STATUS = {
  APPROVED: 'approved',
  REPROVED: 'changes_required',
  PENDING: 'pending'
};

const TrailStatus = ({ status } = {}) => {
  if (status === TRAIL_STATUS.APPROVED)
    return (
      <Status size="S" variant="success" showBullet={false}>
        <Typography>Approved</Typography>
      </Status>
    );

  if (status === TRAIL_STATUS.REPROVED)
    return (
      <Status size="S" variant="alternative" showBullet={false}>
        <Typography>Reproved</Typography>
      </Status>
    );

  return (
    <Status size="S" variant="secondary" showBullet={false}>
      <Typography>Pending</Typography>
    </Status>
  );
};

const useQueryParamsFilters = (filterPath = []) => {
  const [{ query: params } = {}, setQuery] = useQueryParams({});

  const value = params.filters?.$and
    ?.map(filter => get(filter, filterPath))
    .find(Boolean);

  const updateValue = newValue => {
    const filters = params.filters?.$and || [];
    const currentFilterIndex = filters
      ?.map(filter => get(filter, filterPath))
      .findIndex(Boolean);

    const filter = set(filterPath, newValue, {});

    const updatedParams = set(
      [
        'filters',
        '$and',
        currentFilterIndex === -1 ? filters.length : currentFilterIndex
      ],
      filter,
      params
    );

    setQuery({
      ...updatedParams,
      page: 1
    });
  };

  return {
    value,
    updateValue
  };
};
