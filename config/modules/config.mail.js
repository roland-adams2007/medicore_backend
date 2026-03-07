const env = require("../../utils/env");
module.exports = {
  host: env("MAIL_HOST"),
  port: env("MAIL_PORT"),
  secure: true,
  auth: {
    user: env("MAIL_USER"),
    pass: env("MAIL_PASSWORD"),
  },
};
