const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

function updateDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      return;
    }
    console.log('Connected to the SQLite database.');
  });

  db.serialize(() => {
    // Add quantity column to payment_preferences table if it doesn't exist
    db.run(`ALTER TABLE payment_preferences ADD COLUMN quantity INTEGER DEFAULT 1`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('✅ Column quantity already exists');
        } else {
          console.error('Error adding quantity column:', err.message);
        }
      } else {
        console.log('✅ Column quantity added successfully');
      }
    });

    // Update existing records to have quantity = 1 where it's NULL
    db.run(`UPDATE payment_preferences SET quantity = 1 WHERE quantity IS NULL`, (err) => {
      if (err) {
        console.error('Error updating existing records:', err.message);
      } else {
        console.log('✅ Updated existing records with quantity = 1');
      }
    });

    console.log('Database update completed!');
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
  });
}

updateDatabase();