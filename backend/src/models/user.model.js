const db = require('../config/db.config');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { 
        username, 
        email, 
        password, 
        role,
        full_name,
        agreed_to_terms = true,
        terms_version = '1.0',
        dealer_id = null
    } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const agreement_timestamp = new Date();

    try {
        const [result] = await db.query(
            `INSERT INTO users (
                username, 
                email, 
                password, 
                role,
                full_name,
                agreed_to_terms, 
                terms_version, 
                agreement_timestamp,
                dealer_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username, 
                email, 
                hashedPassword, 
                role,
                full_name,
                agreed_to_terms,
                terms_version,
                agreement_timestamp,
                dealer_id
            ]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query(
        `SELECT id, username, email, password, role, dealer_id, dealership_name, full_name, 
        created_at, updated_at FROM users WHERE email = ?`, 
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const [rows] = await db.query(
        `SELECT id, username, email, role, dealer_id, dealership_name, full_name, 
        created_at, updated_at FROM users WHERE username = ?`,
        [username]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT id, username, email, role, dealer_id, dealership_name, full_name, 
        created_at, updated_at FROM users WHERE id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      // Remove any undefined values
      const filteredData = Object.fromEntries(
        Object.entries(userData).filter(([_, v]) => v !== undefined)
      );

      const [result] = await db.query(
        'UPDATE users SET ? WHERE id = ?',
        [filteredData, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const [rows] = await db.query('SELECT id, username, email, role FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByDealerId(dealerId) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE dealer_id = ?', [dealerId]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 