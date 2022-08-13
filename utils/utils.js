const bcrypt = require('bcryptjs');

function generateRandomCode(length) {
    var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        code += possible.charAt(Math.floor(Math.random() * possible.length));
    return code;
}

//dd-mm-yyyy
function stringToDate(dateString, separator){
    let dateParts = dateString.split(separator);
    if(dateParts.length < 3) return null;
    return new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
}

//dd-mm-yyyy
function dateToString(date, separator) {
    if(!date) return null;
    if(typeof date === 'string') date = new Date(date);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return day + separator + month + separator + year;
}

async function getHash(string, saltRounds = 10){
    return await bcrypt.hash(string, saltRounds);
}

function roundDecimals(number, decimals = 2){
    if(!number) number = 0;
    return number.toFixed(decimals);
}

function roundDecimalsGetNumber(number, decimals = 2){
    return +roundDecimals(number, decimals);
}


module.exports = {
    generateRandomCode,
    getHash,
    stringToDate,
    dateToString,
    roundDecimals,
    roundDecimalsGetNumber,
};