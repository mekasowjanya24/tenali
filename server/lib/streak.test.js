'use strict';
// Unit tests for server/lib/streak.js — streak milestone bonus calculations.
// These are pure-function tests: no mocks, no DB, no Express.
// Run with: node server/lib/streak.test.js

const assert = require('node:assert/strict');
const { getStreakMilestoneBonus } = require('./streak');

// ── Streak Milestone Bonuses ─────────────────────────────────────────────────
assert.equal(getStreakMilestoneBonus(3), 50, '3-day streak awards 50 bonus coins');
assert.equal(getStreakMilestoneBonus(7), 150, '7-day streak awards 150 bonus coins');
assert.equal(getStreakMilestoneBonus(15), 300, '15-day streak awards 300 bonus coins');
assert.equal(getStreakMilestoneBonus(30), 500, '30-day streak awards 500 bonus coins');

// ── Non-milestone days return 0 ──────────────────────────────────────────────
assert.equal(getStreakMilestoneBonus(4), 0, '4-day streak returns 0 bonus coins');
assert.equal(getStreakMilestoneBonus(0), 0, '0-day streak returns 0 bonus coins');

console.log('streak.test.js: all assertions passed');
