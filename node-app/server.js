const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000', // URL de la aplicación de React
    credentials: true
}));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // secure en false para desarrollo
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

app.get('/api/data', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const dataPath = path.join(__dirname, '../files/calculadora.txt');
    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/api/data', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const dataPath = path.join(__dirname, '../files/calculadora.txt');
    try {
        const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const newData = req.body;

        existingData.minAFinanciar = newData.minAFinanciar;
        const selectedProduct = Object.keys(newData.productos)[0];
        existingData.productos[selectedProduct] = newData.productos[selectedProduct];

        fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
