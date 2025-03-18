const bcrypt = require('bcryptjs'); // Cambiado de bcrypt a bcryptjs
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leverSRL' // Cambiado de 'mydatabase' a 'leverSRL'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

const regenerateHash = async (username, plainPassword) => {
    const hashedPassword = await bcrypt.hash(plainPassword, 10); // Generar hash con bcryptjs
    console.log(`Hash generado para ${username}:`, hashedPassword);
    db.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, username],
        (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
            } else {
                console.log(`Password updated for user: ${username}`);
            }
            db.end();
        }
    );
};

// Regenera el hash para el usuario "admin" con la contraseña "123"
regenerateHash('admin', '123');
