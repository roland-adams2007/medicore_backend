const mysql = require("mysql2/promise");
const dbConfig = require("./config.db_config");

const pool = mysql.createPool(dbConfig);

pool
  .getConnection()
  .then(() => console.log("✅ MySQL pool connected!"))
  .catch((err) => {
    console.error("❌ Error connecting to MySQL pool:", err);
    process.exit(1);
  });

module.exports = pool;
