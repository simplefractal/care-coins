const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('./state.js');

const MAYA = 'm1';
const JORDAN = 'm2';
const ELENA = 'm5';
const NOW = new Date(2026, 9, 15);

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    }
  };
}

test('seed balances match the story the pages tell', () => {
  const state = S.createState();
  assert.equal(S.balanceOf(state, MAYA), 206);
  assert.equal(S.balanceOf(state, ELENA), 415);
});

test('member totals split what was earned from what was redeemed', () => {
  assert.deepEqual(S.totalsOf(S.createState(), MAYA), { earned: 256, redeemed: 50 });
});

test('redeeming a reward that costs more than the balance is rejected and changes nothing', () => {
  const state = S.createState();
  assert.throws(() => S.redeem(state, MAYA, 'fuel', NOW), /Not enough/);
  assert.equal(S.balanceOf(state, MAYA), 206);
});

test('redeeming spends the cost and queues the reward as pending for the admin', () => {
  const before = S.createState();
  const after = S.redeem(before, MAYA, 'coffee', NOW);
  assert.equal(S.balanceOf(after, MAYA), 156);
  assert.equal(S.balanceOf(before, MAYA), 206, 'the original state is left untouched');
  const tx = after.transactions[0];
  assert.deepEqual(
    [tx.memberId, tx.text, tx.amount, tx.status, tx.date],
    [MAYA, 'Redeemed: Coffee gift card', -50, 'Pending', 'Oct 15']
  );
});

test('awarding adds points and records the reason the admin picked', () => {
  const state = S.award(S.createState(), JORDAN, 'attendance', 25, NOW);
  assert.equal(S.balanceOf(state, JORDAN), 143);
  const tx = state.transactions[0];
  assert.deepEqual(
    [tx.memberId, tx.text, tx.reason, tx.amount, tx.status],
    [JORDAN, 'Perfect attendance', 'Attendance', 25, 'Awarded']
  );
});

test('awarding rejects anything that is not a positive whole number', () => {
  for (const bad of [0, -5, 2.5, '7', NaN]) {
    assert.throws(() => S.award(S.createState(), JORDAN, 'topup', bad, NOW), /positive whole number/);
  }
});

test('marking a pending redemption fulfilled leaves every balance alone', () => {
  const before = S.createState();
  const pending = before.transactions.find((tx) => tx.status === 'Pending');
  const after = S.fulfil(before, pending.id);
  assert.equal(after.transactions.find((tx) => tx.id === pending.id).status, 'Fulfilled');
  assert.equal(S.balanceOf(after, ELENA), 415);
});

test('the next reward is the cheapest one the balance cannot afford yet', () => {
  assert.equal(S.nextReward(206).id, 'fuel');
  assert.equal(S.nextReward(600), null);
});

test('loading falls back to the seed when stored data is missing, corrupt or unreadable', () => {
  assert.equal(S.balanceOf(S.load(fakeStorage()), MAYA), 206);
  assert.equal(S.balanceOf(S.load(fakeStorage({ [S.STORAGE_KEY]: '{not json' })), MAYA), 206);
  const blocked = {
    getItem: () => {
      throw new Error('storage blocked');
    },
    setItem: () => {
      throw new Error('storage blocked');
    }
  };
  assert.equal(S.balanceOf(S.load(blocked), MAYA), 206);
  S.save(blocked, S.createState());
});

test('a saved redemption is still there after loading', () => {
  const storage = fakeStorage();
  S.save(storage, S.redeem(S.createState(), MAYA, 'coffee', NOW));
  assert.equal(S.balanceOf(S.load(storage), MAYA), 156);
});
