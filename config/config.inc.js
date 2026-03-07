const mail_config = require("./modules/config.mail");
const db_config = require("./modules/config.db_config");
const db_connection = require("./modules/config.dbconnection");
const constants = require("./modules/config.constants");
const redis = require("./modules/config.redis");
const system = require("./modules/config.app");
module.exports = {
  mail_config: mail_config,
  db_config: db_config,
  db_connection: db_connection,
  constants: constants,
  redis: redis,
  system: system,
};
