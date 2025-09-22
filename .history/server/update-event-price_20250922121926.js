const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('📊 Connected to SQLite database.');
  
  // Consultar eventos actuales
  db.all("SELECT * FROM events", [], (err, rows) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return;
    }
    
    console.log('📋 Current events:');
    console.table(rows);
    
    // Actualizar precio del evento a $8000
    db.run(`
      UPDATE events 
      SET 
        price = 8000.00,
        name = "🎃 Fiesta de Halloween 2025 👻",
        description = "La fiesta de Halloween más terrorífica del año. Una noche de miedo y diversión que no te puedes perder.",
        location = "SECRET LOCATION",
        date = "2025-07-15 22:00:00",
        image_url = "https://static.vecteezy.com/system/resources/previews/027/807/583/non_2x/spooky-halloween-wallpaper-with-pumpkin-and-old-house-free-photo.jpg"
      WHERE id = 1
    `, [], function(err) {
      if (err) {
        console.error('❌ Error updating event:', err.message);
        return;
      }
      
      console.log('✅ Event updated successfully! Changes:', this.changes);
      
      // Verificar la actualización
      db.all("SELECT * FROM events", [], (err, rows) => {
        if (err) {
          console.error('Error fetching updated events:', err.message);
          return;
        }
        
        console.log('📋 Updated events:');
        console.table(rows);
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('✅ Database connection closed.');
          }
        });
      });
    });
  });
});