(function () {
  const S = window.RewardsState;
  const { esc, config, storage } = window.DemoUI;
  const MEMBER_ID = 'm1';
  const MEMBER_EMAIL = 'maya.reyes@example.com';

  const GIFT_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v8a1 1 0 0 0 1 1h14"/><path d="M19 12v8a1 1 0 0 1-1 1"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';

  let state = S.load(storage);
  let confirmingId = null;

  const el = (id) => document.getElementById(id);

  function giftCard(gift, balance) {
    const short = gift.cost - balance;
    const action =
      confirmingId === gift.id
        ? `<div class="confirm">
             <div class="confirm-text">Spend ${gift.cost} ${esc(config.currency)} on this reward?</div>
             <div class="confirm-actions">
               <button class="btn btn-primary" type="button" data-action="confirm" data-id="${gift.id}">Confirm</button>
               <button class="btn btn-ghost" type="button" data-action="cancel" data-id="${gift.id}">Cancel</button>
             </div>
           </div>`
        : `<button class="btn btn-primary btn-block" type="button" data-action="ask" data-id="${gift.id}" ${short > 0 ? 'disabled' : ''}>
             ${short > 0 ? `${short} more to unlock` : 'Redeem'}
           </button>`;
    return `<div class="card">
      <div class="card-top">
        <div class="icon-box">${GIFT_ICON}</div>
        <div class="cost"><span class="coin"></span><span>${gift.cost}</span></div>
      </div>
      <div><h3>${esc(gift.name)}</h3><div class="tag">${esc(gift.tag)}</div></div>
      ${action}
    </div>`;
  }

  function activityRow(tx) {
    const positive = tx.amount > 0;
    return `<div class="activity-row">
      <div class="date">${esc(tx.date)}</div>
      <div class="row-text">${esc(tx.text)}</div>
      <div><span class="pill">${esc(tx.reason)}</span></div>
      <div class="amount ${positive ? 'amt-pos' : 'amt-neg'}">${positive ? '+' : '−'}${Math.abs(tx.amount)}</div>
    </div>`;
  }

  function render() {
    const balance = S.balanceOf(state, MEMBER_ID);
    const totals = S.totalsOf(state, MEMBER_ID);
    const next = S.nextReward(balance);
    const pct = next ? Math.min(100, Math.round((balance / next.cost) * 100)) : 100;

    el('balance').textContent = balance;
    el('earned').textContent = totals.earned;
    el('redeemed').textContent = totals.redeemed;
    el('nextTitle').textContent = next
      ? `${next.cost - balance} ${config.currency} to go until ${next.name}`
      : 'You can redeem every reward in the catalog';
    el('progressNote').textContent = next
      ? `${balance} of ${next.cost} ${config.currency}`
      : `${balance} ${config.currency} available`;
    el('bar').setAttribute('aria-valuenow', pct);
    el('barFill').style.width = pct + '%';

    el('gifts').innerHTML = S.GIFTS.map((gift) => giftCard(gift, balance)).join('');
    el('activity').innerHTML = state.transactions
      .filter((tx) => tx.memberId === MEMBER_ID)
      .map(activityRow)
      .join('');
  }

  function commit(next) {
    state = next;
    S.save(storage, state);
  }

  function focusIn(selector) {
    const target = el('gifts').querySelector(selector);
    if (target) target.focus();
  }

  function showToast(text) {
    el('toastText').textContent = text;
    el('toast').hidden = false;
  }

  el('gifts').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;

    if (action === 'ask') {
      confirmingId = id;
      el('toast').hidden = true;
      render();
      focusIn('[data-action="confirm"]');
    } else if (action === 'cancel') {
      confirmingId = null;
      render();
      focusIn(`[data-action="ask"][data-id="${id}"]`);
    } else if (action === 'confirm') {
      const gift = S.GIFTS.find((g) => g.id === id);
      commit(S.redeem(state, MEMBER_ID, id));
      confirmingId = null;
      render();
      showToast(`${gift.name} is on its way to ${MEMBER_EMAIL}. ${gift.cost} ${config.currency} spent.`);
    }
  });

  el('toastDismiss').addEventListener('click', () => (el('toast').hidden = true));

  el('reset').addEventListener('click', () => {
    commit(S.createState());
    confirmingId = null;
    el('toast').hidden = true;
    render();
  });

  // The admin page may change the shared state from another tab.
  window.addEventListener('storage', (event) => {
    if (event.key !== S.STORAGE_KEY) return;
    state = S.load(storage);
    render();
  });

  render();
})();
