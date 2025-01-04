const db = require('../config/db.config');

class Callback {
    static async create(callbackData) {
        const { name, phone } = callbackData;
        
        try {
            const [result] = await db.query(
                `INSERT INTO callbacks (name, phone, status) VALUES (?, ?, 'pending')`,
                [name, phone]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating callback:', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await db.query(
                `SELECT * FROM callbacks ORDER BY created_at DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async updateStatus(id, status) {
        try {
            const [result] = await db.query(
                'UPDATE callbacks SET status = ? WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Callback;
