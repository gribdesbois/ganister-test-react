module.exports = {
  ganisterError: (message = '', statusCode = 500) => {
    const error = new Error();

    const properties = {
      name: 'Ganister Error',
      message,
      error: true,
      statusCode,
    };

    Object.assign(error, properties);
    throw error;
  },
};
