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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

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

        // Create payment_preferences table for MercadoPago
        db.run(`
          CREATE TABLE IF NOT EXISTS payment_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preference_id TEXT UNIQUE NOT NULL,
            external_reference TEXT UNIQUE NOT NULL,
            event_id INTEGER NOT NULL,
            user_id TEXT,
            quantity INTEGER NOT NULL,
            attendees_data TEXT NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events (id)
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
              name: "🎃 Fiesta de Halloween 2025 👻",
              description: "La fiesta de Halloween más terrorífica del año. Una noche de miedo y diversión que no te puedes perder.",
              date: "2025-07-15 22:00:00",
              location: "SECRET LOCATION",
              price: 8000.00,
              total_tickets: 200,
              available_tickets: 200,
              image_url: "https://static.vecteezy.com/system/resources/previews/027/807/583/non_2x/spooky-halloween-wallpaper-with-pumpkin-and-old-house-free-photo.jpg"
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
