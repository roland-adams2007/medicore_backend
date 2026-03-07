const { db_connection } = require("../config/config.inc");

const State = {
  getAll: async () => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT 
            s.id,
            s.name,
            s.code
         FROM states s
         ORDER BY s.id DESC`,
      );

      return rows || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};

module.exports = State;
