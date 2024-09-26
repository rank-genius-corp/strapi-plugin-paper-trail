const getTrailEntityName = ({ trail, contentTypesSettings } = {}) => {
  if (!contentTypesSettings?.length) return trail.recordId;

  const contentTypeSettings = contentTypesSettings.find(
    type => type.uid === trail.contentType
  );
  const mainField = contentTypeSettings?.settings?.mainField;
  if (!mainField || mainField === 'id') return `ID ${trail.recordId}`;

  const name = trail.content[mainField] || trail.previousContent?.[mainField];

  return `${name} (ID ${trail.recordId})`;
};

export default getTrailEntityName;
