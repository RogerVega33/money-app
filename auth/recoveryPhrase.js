const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const wordlist = require('./wordlists/eff-short.json');

function generateRecoveryPhrase(wordCount = 8) {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
        const index = crypto.randomInt(0, wordlist.length);
        words.push(wordlist[index]);
    }
    return words.join('-');
}

function normalizeRecoveryPhrase(phrase) {
    return phrase.normalize('NFD').toLowerCase().trim().replace(/[\s-]+/gu, '-');
}

async function hashRecoveryPhrase(phrase) {
    return bcrypt.hash(normalizeRecoveryPhrase(phrase), 12);
}

async function verifyRecoveryPhrase(phrase, hash) {
    if (typeof phrase !== 'string' || !phrase.trim()) return false;
    const normalized = normalizeRecoveryPhrase(phrase);
    if (await bcrypt.compare(normalized, hash)) return true;
    // Preserve exact verification of previously stored, unnormalized phrases.
    return normalized !== phrase && bcrypt.compare(phrase, hash);
}

module.exports = { generateRecoveryPhrase, hashRecoveryPhrase, verifyRecoveryPhrase };
