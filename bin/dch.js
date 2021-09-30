#!/usr/bin/env node

var main = require('../lib/index.js');

main().catch(err => {
    console.error(err);
});