const fs = require('fs');
const mysql = require('mysql');
const path = require('path');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leverSRL'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

const calculadoraPath = path.join(__dirname, '../files/calculadora.txt');
const ltvPath = path.join(__dirname, '../files/ltv.json');

const addColumnIfNotExists = (table, column, definition) => {
    return new Promise((resolve, reject) => {
        const query = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`;
        db.query(query, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const insertProduct = (nombre, plazo, { interest, fee, minfee }) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO productos (nombre, plazo, interest, fee, minfee) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [nombre, plazo, interest, fee, minfee], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
};

const migrateCalculadora = () => {
    const calculadoraData = JSON.parse(fs.readFileSync(calculadoraPath, 'utf8'));
    const { productos, minAFinanciar } = calculadoraData;

    const insertConfig = (minAFinanciar) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO configuracion (id, minAFinanciar) VALUES (1, ?) ON DUPLICATE KEY UPDATE minAFinanciar = VALUES(minAFinanciar)';
            db.query(query, [minAFinanciar.valor], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };

    const migrate = async () => {
        try {
            await insertConfig(minAFinanciar);
            for (const [nombre, { plazos }] of Object.entries(productos)) {
                for (const [plazo, datos] of Object.entries(plazos)) {
                    await insertProduct(nombre, plazo, datos);
                }
            }
            console.log('Calculadora data migrated successfully');
        } catch (err) {
            console.error('Error migrating calculadora data:', err);
        }
    };

    migrate();
};

const insertLtv = (producto, year, { value, show }) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO ltv (producto, year, value, `show`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), `show` = VALUES(`show`)';
        db.query(query, [producto, year, value, show], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const migrateLtv = () => {
    const ltvData = JSON.parse(fs.readFileSync(ltvPath, 'utf8'));
    const { productos } = ltvData;

    const migrate = async () => {
        try {
            await addColumnIfNotExists('ltv', 'producto', 'VARCHAR(255)');
            for (const [producto, years] of Object.entries(productos)) {
                for (const [year, value] of Object.entries(years)) {
                    await insertLtv(producto, year, { value, show: false });
                }
            }
            console.log('LTV data migrated successfully');
        } catch (err) {
            console.error('Error migrating LTV data:', err);
        }
    };

    migrate();
};

migrateCalculadora();
migrateLtv();
