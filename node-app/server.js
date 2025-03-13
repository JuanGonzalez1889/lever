const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');

const app = express();
const PORT = 5000;

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

app.use(bodyParser.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost'],
    credentials: true
}));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Servir archivos estáticos desde la carpeta 'files'
app.use('/files', express.static(path.join(__dirname, '../files')));

const users = {
    admin: '123'
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.username = username;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-session', (req, res) => {
    if (req.session.username) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/data', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const query = `
        SELECT p.nombre AS producto, p.plazo, p.interest, p.fee, p.minfee, l.year, l.value, l.show, c.minAFinanciar
        FROM productos p
        LEFT JOIN ltv l ON p.nombre = l.producto
        LEFT JOIN configuracion c ON 1=1
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        const data = { productos: {}, ltv: {}, minAFinanciar: null };
        results.forEach(row => {
            const productoNombre = row.producto;
            if (!data.productos[productoNombre]) {
                data.productos[productoNombre] = { plazos: {} };
            }
            data.productos[productoNombre].plazos[row.plazo] = {
                interest: row.interest,
                fee: row.fee,
                minfee: row.minfee
            };
            if (!data.ltv[productoNombre]) {
                data.ltv[productoNombre] = {};
            }
            if (row.year) {
                data.ltv[productoNombre][row.year] = {
                    value: row.value,
                    show: row.show
                };
            }
            if (row.minAFinanciar !== null) {
                data.minAFinanciar = row.minAFinanciar;
            }
        });

        res.json(data);
    });
});

app.post('/api/data', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { minAFinanciar, productos, ltv } = req.body;

    const updateConfig = new Promise((resolve, reject) => {
        const query = `
            INSERT INTO configuracion (id, minAFinanciar)
            VALUES (1, ?)
            ON DUPLICATE KEY UPDATE minAFinanciar = VALUES(minAFinanciar)
        `;
        db.query(query, [minAFinanciar], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

    const updateProductos = Object.entries(productos).flatMap(([nombre, { plazos }]) =>
        Object.entries(plazos).map(([plazo, { interest, fee, minfee }]) => {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE productos
                    SET interest = ?, fee = ?, minfee = ?
                    WHERE nombre = ? AND plazo = ?
                `;
                db.query(query, [interest, fee, minfee, nombre, plazo], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        })
    );

    const updateLtv = Object.entries(ltv).flatMap(([producto, years]) =>
        Object.entries(years).map(([year, value]) => {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE ltv
                    SET value = ?, \`show\` = ?
                    WHERE producto = ? AND year = ?
                `;
                db.query(query, [value.value || value, value.show || false, producto, year], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        })
    );

    Promise.all([updateConfig, ...updateProductos, ...updateLtv])
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error('Error saving data:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
