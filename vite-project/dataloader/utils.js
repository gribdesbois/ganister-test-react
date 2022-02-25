const timer = (start) => {
  const time = Math.abs(start - Date.now());
  if (time >= 60000) {
    return `${((time / 1000) / 60).toFixed(2)}min`
  } else if (time >= 1000) {
    return `${((time / 1000)).toFixed(3)}s`;
  } else {
    return `${time}ms`
  }
};

module.exports = timer;