function env(name, defaultName = "") {
  const env = process.env.hasOwnProperty(name)
    ? process.env[name]
    : defaultName;
  return env;
}
module.exports = env;
