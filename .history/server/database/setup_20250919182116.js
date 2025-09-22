const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
let db = null;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      db.serialize(() => {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'user',
            password_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Add role column to existing users table if it doesn't exist
        db.run(`
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'
        `, (err) => {
          // Ignore error if column already exists
        });

        // Add password_hash column to existing users table if it doesn't exist  
        db.run(`
          ALTER TABLE users ADD COLUMN password_hash TEXT
        `, (err) => {
          // Ignore error if column already exists
        });

        // Create admin user if none exists
        db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
          if (err) {
            console.error('Error checking admin users:', err);
            return;
          }
          
          if (row.count === 0) {
            const bcrypt = require('bcryptjs');
            const adminPassword = 'admin123'; // Cambiar en producción
            const hashedPassword = bcrypt.hashSync(adminPassword, 10);
            
            db.run(`
              INSERT INTO users (email, name, phone, role, password_hash)
              VALUES (?, ?, ?, ?, ?)
            `, ['admin@ticketing.com', 'Administrador', '123456789', 'admin', hashedPassword], (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
              } else {
                console.log('Admin user created: admin@ticketing.com / admin123');
              }
            });
          }
        });

        // Create events table
        db.run(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            date DATETIME NOT NULL,
            location TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            total_tickets INTEGER NOT NULL,
            available_tickets INTEGER NOT NULL,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create tickets table
        db.run(`
          CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_code TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            qr_code TEXT,
            status TEXT DEFAULT 'active',
            payment_intent_id TEXT,
            amount_paid DECIMAL(10,2) NOT NULL,
            attendee_name TEXT NOT NULL,
            attendee_email TEXT NOT NULL,
            attendee_dni TEXT NOT NULL,
            attendee_phone TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id)
          )
        `);

        // Create payments table
        db.run(`
          CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_intent_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL,
            currency TEXT DEFAULT 'eur',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Insert sample event if none exists
        db.get("SELECT COUNT(*) as count FROM events", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count === 0) {
            const sampleEvent = {
              name: "Fiesta de Verano 2024",
              description: "La mejor fiesta del verano con música en vivo, DJs y mucho más",
              date: "2024-07-15 22:00:00",
              location: "Club Nocturno XYZ, Madrid",
              price: 25.00,
              total_tickets: 200,
              available_tickets: 200,
              image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800"
            };

            db.run(`
              INSERT INTO events (name, description, date, location, price, total_tickets, available_tickets, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [sampleEvent.name, sampleEvent.description, sampleEvent.date, sampleEvent.location, 
                sampleEvent.price, sampleEvent.total_tickets, sampleEvent.available_tickets, sampleEvent.image_url]);
          }
          
          resolve();
        });
      });
    });
  });
}

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};
