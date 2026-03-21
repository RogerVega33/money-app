const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { wordlist } = require('@scure/bip39/wordlists/spanish.js');

function generateRecoveryPhrase(wordCount = 6) {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
        const index = crypto.randomInt(0, wordlist.length);
        words.push(wordlist[index]);
    }
    return words.join('-');
}

async function hashRecoveryPhrase(phrase) {
    return bcrypt.hash(phrase, 12);
}

async function verifyRecoveryPhrase(phrase, hash) {
    return bcrypt.compare(phrase, hash);
}

module.exports = { generateRecoveryPhrase, hashRecoveryPhrase, verifyRecoveryPhrase };