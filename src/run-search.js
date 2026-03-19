#!/usr/bin/env node
// Standalone script to run a search (useful for testing or manual runs)
require('dotenv').config();
const { runFullSearch } = require('./search-engine');

runFullSearch()
  .then(result => {
    console.log('\nSearch complete:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Search failed:', err);
    process.exit(1);
  });
