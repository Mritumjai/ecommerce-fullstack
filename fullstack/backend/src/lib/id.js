let counter = 1;

function createId(prefix) {
  const id = `${prefix}_${counter}`;
  counter += 1;
  return id;
}

module.exports = {
  createId
};
