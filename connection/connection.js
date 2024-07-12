// New Module
var mysql = require('mysql'), conf = require('../utility/config');
let db = conf.mysqlserver1;

// Initialize pool
let pool = mysql.createPool({
    connectionLimit: 999 * 1,
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database,
    debug: false
});

// console.log(pool);
var mysqlPromise = require('promise-mysql2');
let connection = mysqlPromise.createPool({
    "host": db.host,
    "user": db.user,
    "password": db.password,
    "database": db.database,
    "connectionLimit": 999 * 1,
});

module.exports = pool;
module.exports.poolpromise = connection;