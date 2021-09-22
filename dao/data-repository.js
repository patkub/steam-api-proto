// data.js
// basic data, needs improvement

class DataRepository {
    constructor(dao) {
      this.dao = dao
    }
  
    createTable() {
      const sql = `
      CREATE TABLE IF NOT EXISTS data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT)`
      return this.dao.run(sql)
    }

    create(name) {
        return this.dao.run(
          `INSERT INTO data (name)
            VALUES (?)`,
          [name])
      }
    
    update(data) {
        const { id, name } = data
        return this.dao.run(
          `UPDATE data SET name = ? WHERE id = ?`,
          [name, id]
        )
      }
    
    delete(id) {
        return this.dao.run(
            `DELETE FROM data WHERE id = ?`,
            [id]
        )
    }

    getById(id) {
        return this.dao.get(
            `SELECT * FROM data WHERE id = ?`,
            [id])
    }

    getAll() {
        return this.dao.all(`SELECT * FROM data`)
    }
  }
  
  module.exports = DataRepository;