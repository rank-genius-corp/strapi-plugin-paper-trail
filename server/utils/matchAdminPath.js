module.exports = string => {
  const regex =
    /\/content-manager\/(collection|single)-types\/([a-zA-Z0-9-]+::[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+)(?:\/\d*)?/;
  return string.match(regex);
};
