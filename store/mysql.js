const mysql = require('mysql');
const logger = require('../network/logger');
const config = require('../config');

const dbconf = {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
};

// El pool reutiliza conexiones y reemplaza las que sufren errores fatales.
const pool = mysql.createPool({ ...dbconf, connectionLimit: config.mysql.connectionLimit });

pool.on('connection', connection => {
    connection.on('error', error => {
        logger.writeError('db_connection_error', error);
    });
});

function execute(sql, parameters, callback) {
    pool.query(sql, parameters, (error, result) => {
        if (error && error.fatal) {
            logger.writeError('db_connection_error', error);
        }
        callback(error, result);
    });
}

function list(table){
    return new Promise((resolve, reject)=>{
        execute(`SELECT * FROM ${table}`, [], (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function get(table, id){
    return new Promise((resolve, reject)=>{
        execute(`SELECT * FROM ${table} WHERE id=${id}`, [], (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function insert(table, data){
    return new Promise((resolve, reject)=>{
        execute(`INSERT INTO ${table} SET ?`, data, (err, result) => {
            if(err) return reject(err);
            resolve(result);
        });
    });
}

function update(table, data, id) {
    return new Promise((resolve, reject) => {
        execute(`UPDATE ${table} SET ? WHERE ?`, [data, id], (err, result) => {
            if (err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        })
    })
}

function deleteData(table, id) {
    return new Promise((resolve, reject) => {
        execute(`DELETE FROM ${table} WHERE ?`, [id], (err, result) => {
            if (err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        })
    })
}

function query(table, query, andClause){
    return new Promise((resolve, reject)=>{
        execute(`SELECT * FROM ${table} WHERE ? ${andClause?'AND ?': ''}`, [query, andClause], (err, result) => {
            if(err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        });
    });
}

function personalizedQuery(query, parameters){
    return new Promise((resolve, reject)=>{
        execute(`${query}`, parameters, (err, result) => {
            if(err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        });
    });
}

module.exports = {
    list,
    get,
    insert,
    update,
    query,
    deleteData,
    personalizedQuery,
};
