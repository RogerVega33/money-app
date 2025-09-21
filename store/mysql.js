const mysql = require('mysql');
const config = require('../config');

const dbconf = {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
};

let connection;

function handleConnection(){
    connection = mysql.createConnection(dbconf);
    
    connection.connect((error) =>{
        if(error){
            console.error('[db error]', error);
            setTimeout(handleConnection, 200);    
        }else{
            console.log('DB connected');
        }
    });

    connection.on('error', error => {
        console.error('[db error]', error);
        if(error.code === 'PROTOCOL_CONNECTION_LOST' || error.code ===  'ECONNRESET'){
            handleConnection();
        } else{
            throw error;
        }
    });
}

handleConnection();

function list(table){
    return new Promise((resolve, reject)=>{
        connection.query(`SELECT * FROM ${table}`, (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function get(table, id){
    return new Promise((resolve, reject)=>{
        connection.query(`SELECT * FROM ${table} WHERE id=${id}`, (err, data) => {
            if(err) return reject(err);
            resolve(data);
        });
    });
}

function insert(table, data){
    return new Promise((resolve, reject)=>{
        connection.query(`INSERT INTO ${table} SET ?`, data, (err, result) => {
            if(err) return reject(err);
            resolve(result);
        });
    });
}

function update(table, data, id) {
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE ${table} SET ? WHERE ?`, [data, id], (err, result) => {
            if (err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        })
    })
}

function deleteData(table, id) {
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM ${table} WHERE ?`, [id], (err, result) => {
            if (err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        })
    })
}

function query(table, query, andClause){
    return new Promise((resolve, reject)=>{
        connection.query(`SELECT * FROM ${table} WHERE ? ${andClause?'AND ?': ''}`, [query, andClause], (err, result) => {
            if(err) return reject(err);
            if(result) resolve(JSON.parse(JSON.stringify(result)));
            resolve(null);
        });
    });
}

function personalizedQuery(query, parameters){
    return new Promise((resolve, reject)=>{
        connection.query(`${query}`, parameters, (err, result) => {
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