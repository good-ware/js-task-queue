module.exports = {
  extends: ['airbnb-base', 'prettier'],
  rules: {
    'max-len': [
      'error',
      {
        code: 120,
        ignoreUrls: true,
      },
    ],
  },
};
