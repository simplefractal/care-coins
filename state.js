(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RewardsState = factory();
})(this, function () {
  const STORAGE_KEY = 'rewards-demo';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const GIFTS = [
    { id: 'coffee', name: 'Coffee gift card', tag: 'Food and drink', cost: 50 },
    { id: 'grocery', name: 'Grocery gift card', tag: 'Groceries', cost: 150 },
    { id: 'stream', name: 'Streaming credit', tag: 'Entertainment', cost: 150 },
    { id: 'fuel', name: 'Fuel gift card', tag: 'Travel', cost: 250 },
    { id: 'dinner', name: 'Dinner for two', tag: 'Dining', cost: 300 },
    { id: 'shop', name: 'Online shopping credit', tag: 'Shopping', cost: 500 }
  ];

  const REASONS = [
    { id: 'checkin', label: 'Correct check-in', short: 'Check-in', amount: 3 },
    { id: 'attendance', label: 'Perfect attendance', short: 'Attendance', amount: 25 },
    { id: 'birthday', label: 'Birthday', short: 'Birthday', amount: 25 },
    { id: 'anniversary', label: 'Work anniversary', short: 'Anniversary', amount: 25 },
    { id: 'mentor', label: 'Mentoring a new hire', short: 'Mentoring', amount: 50 },
    { id: 'levelup', label: 'Moving up a level', short: 'Level-up', amount: 50 },
    { id: 'topup', label: 'Manual top-up', short: 'Top-up', amount: 10 }
  ];

  const SEED = {
    members: [
      { id: 'm1', name: 'Maya Reyes', initials: 'MR', role: 'Registered nurse', location: 'North clinic', opening: 0 },
      { id: 'm2', name: 'Jordan Ellis', initials: 'JE', role: 'Practical nurse', location: 'North clinic', opening: 93 },
      { id: 'm3', name: 'Priya Nair', initials: 'PN', role: 'Home health aide', location: 'Riverside', opening: 339 },
      { id: 'm4', name: 'Marcus Cole', initials: 'MC', role: 'Physical therapist', location: 'Riverside', opening: 127 },
      { id: 'm5', name: 'Elena Park', initials: 'EP', role: 'Registered nurse', location: 'Lakeside', opening: 715 },
      { id: 'm6', name: 'Tomas Silva', initials: 'TS', role: 'Home health aide', location: 'Lakeside', opening: 29 }
    ],
    // Newest first.
    transactions: [
      { id: 's14', memberId: 'm5', date: 'Oct 15', text: 'Redeemed: Dinner for two', reason: 'Redemption', amount: -300, status: 'Pending' },
      { id: 's13', memberId: 'm3', date: 'Oct 14', text: 'Shift on Oct 14', reason: 'Check-in', amount: 3, status: 'Awarded' },
      { id: 's12', memberId: 'm1', date: 'Oct 14', text: 'Shift on Oct 14', reason: 'Check-in', amount: 3, status: 'Awarded' },
      { id: 's11', memberId: 'm1', date: 'Oct 13', text: 'Shift on Oct 13', reason: 'Check-in', amount: 3, status: 'Awarded' },
      { id: 's10', memberId: 'm1', date: 'Oct 10', text: 'Perfect attendance for September', reason: 'Attendance', amount: 25, status: 'Awarded' },
      { id: 's9', memberId: 'm2', date: 'Oct 10', text: 'Perfect attendance for September', reason: 'Attendance', amount: 25, status: 'Awarded' },
      { id: 's8', memberId: 'm4', date: 'Oct 08', text: 'Redeemed: Coffee gift card', reason: 'Redemption', amount: -50, status: 'Fulfilled' },
      { id: 's7', memberId: 'm1', date: 'Oct 03', text: 'Mentored a new hire', reason: 'Mentoring', amount: 50, status: 'Awarded' },
      { id: 's6', memberId: 'm1', date: 'Sep 21', text: 'Happy birthday', reason: 'Birthday', amount: 25, status: 'Awarded' },
      { id: 's5', memberId: 'm1', date: 'Sep 05', text: 'Redeemed: Coffee gift card', reason: 'Redemption', amount: -50, status: 'Fulfilled' },
      { id: 's4', memberId: 'm1', date: 'Aug 14', text: 'Two years with the team', reason: 'Anniversary', amount: 25, status: 'Awarded' },
      { id: 's3', memberId: 'm1', date: 'Aug 10', text: 'Perfect attendance for July', reason: 'Attendance', amount: 25, status: 'Awarded' },
      { id: 's2', memberId: 'm1', date: 'Jul 02', text: 'Moved up to Senior', reason: 'Level-up', amount: 50, status: 'Awarded' },
      { id: 's1', memberId: 'm1', date: 'Jan 06', text: 'Welcome bonus', reason: 'Welcome', amount: 50, status: 'Awarded' }
    ],
    nextId: 1
  };

  function createState() {
    return JSON.parse(JSON.stringify(SEED));
  }

  function formatDate(date) {
    return MONTHS[date.getMonth()] + ' ' + String(date.getDate()).padStart(2, '0');
  }

  function memberOf(state, memberId) {
    const member = state.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Unknown team member');
    return member;
  }

  function balanceOf(state, memberId) {
    const member = memberOf(state, memberId);
    return state.transactions
      .filter((tx) => tx.memberId === memberId)
      .reduce((sum, tx) => sum + tx.amount, member.opening);
  }

  function totalsOf(state, memberId) {
    const own = state.transactions.filter((tx) => tx.memberId === memberId);
    return {
      earned: own.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
      redeemed: own.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum - tx.amount, 0)
    };
  }

  function addTransaction(state, tx) {
    return {
      ...state,
      transactions: [{ id: 'tx-' + state.nextId, ...tx }, ...state.transactions],
      nextId: state.nextId + 1
    };
  }

  function redeem(state, memberId, giftId, now = new Date()) {
    const gift = GIFTS.find((g) => g.id === giftId);
    if (!gift) throw new Error('Unknown reward');
    if (balanceOf(state, memberId) < gift.cost) throw new Error('Not enough balance for this reward');
    return addTransaction(state, {
      memberId,
      date: formatDate(now),
      text: 'Redeemed: ' + gift.name,
      reason: 'Redemption',
      amount: -gift.cost,
      status: 'Pending'
    });
  }

  function award(state, memberId, reasonId, amount, now = new Date()) {
    const reason = REASONS.find((r) => r.id === reasonId);
    if (!reason) throw new Error('Unknown reason');
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Amount must be a positive whole number');
    memberOf(state, memberId);
    return addTransaction(state, {
      memberId,
      date: formatDate(now),
      text: reason.label,
      reason: reason.short,
      amount,
      status: 'Awarded'
    });
  }

  function fulfil(state, transactionId) {
    return {
      ...state,
      transactions: state.transactions.map((tx) => (tx.id === transactionId ? { ...tx, status: 'Fulfilled' } : tx))
    };
  }

  function nextReward(balance) {
    return GIFTS.find((g) => g.cost > balance) || null;
  }

  function isValid(parsed) {
    return (
      parsed &&
      Array.isArray(parsed.members) &&
      Array.isArray(parsed.transactions) &&
      Number.isInteger(parsed.nextId)
    );
  }

  // Storage can be blocked (private windows, embedded previews): fall back to the seed.
  function load(storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return isValid(parsed) ? parsed : createState();
    } catch (error) {
      return createState();
    }
  }

  // When storage is blocked the page keeps working, but the two pages stop sharing state.
  function save(storage, state) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {}
  }

  return {
    STORAGE_KEY,
    GIFTS,
    REASONS,
    createState,
    formatDate,
    balanceOf,
    totalsOf,
    redeem,
    award,
    fulfil,
    nextReward,
    load,
    save
  };
});
