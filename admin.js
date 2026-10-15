(function () {
  const S = window.RewardsState;
  const { esc, config, storage } = window.DemoUI;
  const DEFAULT_REASON = 'attendance';

  let state = S.load(storage);
  let selectedId = 'm1';
  let reasonId = DEFAULT_REASON;
  let amount = S.REASONS.find((r) => r.id === DEFAULT_REASON).amount;

  const el = (id) => document.getElementById(id);

  function memberRow(member) {
    const selected = member.id === selectedId;
    return `<button class="member ${selected ? 'selected' : ''}" type="button" aria-pressed="${selected}" data-id="${member.id}">
      <div class="member-name">
        <div class="avatar" aria-hidden="true">${esc(member.initials)}</div>
        <div>${esc(member.name)}</div>
      </div>
      <div class="member-muted">${esc(member.role)}</div>
      <div class="member-muted">${esc(member.location)}</div>
      <div class="member-balance">${S.balanceOf(state, member.id)}</div>
    </button>`;
  }

  function logRow(tx) {
    const member = state.members.find((m) => m.id === tx.memberId);
    const positive = tx.amount > 0;
    const fulfil =
      tx.status === 'Pending'
        ? `<button class="btn btn-ghost btn-sm" type="button" data-fulfil="${esc(tx.id)}">Mark fulfilled</button>`
        : '';
    return `<div class="log-row">
      <div class="date">${esc(tx.date)}</div>
      <div class="log-who">${esc(member.name)}</div>
      <div class="row-text">${esc(tx.text)}</div>
      <div class="amount ${positive ? 'amt-pos' : 'amt-neg'}">${positive ? '+' : '−'}${Math.abs(tx.amount)}</div>
      <div class="log-status"><span class="pill">${esc(tx.status)}</span>${fulfil}</div>
    </div>`;
  }

  function render() {
    const selected = state.members.find((m) => m.id === selectedId);
    el('members').innerHTML = state.members.map(memberRow).join('');
    el('awardTo').textContent = selected.name;
    el('reasons').innerHTML = S.REASONS.map(
      (r) =>
        `<button class="chip" type="button" aria-pressed="${r.id === reasonId}" data-reason="${r.id}">${esc(r.label)}</button>`
    ).join('');
    el('amount').textContent = amount;
    el('award').textContent = `Award ${amount} ${config.currency}`;
    el('log').innerHTML = state.transactions.map(logRow).join('');
  }

  function commit(next) {
    state = next;
    S.save(storage, state);
  }

  function showToast(text) {
    el('toastText').textContent = text;
    el('toast').hidden = false;
  }

  el('members').addEventListener('click', (event) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    selectedId = row.dataset.id;
    el('toast').hidden = true;
    render();
    el('members').querySelector(`[data-id="${selectedId}"]`).focus();
  });

  el('reasons').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-reason]');
    if (!chip) return;
    reasonId = chip.dataset.reason;
    amount = S.REASONS.find((r) => r.id === reasonId).amount;
    render();
    el('reasons').querySelector(`[data-reason="${reasonId}"]`).focus();
  });

  el('dec').addEventListener('click', () => {
    amount = Math.max(1, amount - 5);
    render();
  });

  el('inc').addEventListener('click', () => {
    amount += 5;
    render();
  });

  el('award').addEventListener('click', () => {
    const member = state.members.find((m) => m.id === selectedId);
    const reason = S.REASONS.find((r) => r.id === reasonId);
    commit(S.award(state, selectedId, reasonId, amount));
    render();
    showToast(`${amount} ${config.currency} awarded to ${member.name} for ${reason.label.toLowerCase()}.`);
  });

  el('log').addEventListener('click', (event) => {
    const button = event.target.closest('[data-fulfil]');
    if (!button) return;
    commit(S.fulfil(state, button.dataset.fulfil));
    render();
  });

  el('toastDismiss').addEventListener('click', () => (el('toast').hidden = true));

  el('reset').addEventListener('click', () => {
    commit(S.createState());
    el('toast').hidden = true;
    render();
  });

  // The member page may change the shared state from another tab.
  window.addEventListener('storage', (event) => {
    if (event.key !== S.STORAGE_KEY) return;
    state = S.load(storage);
    render();
  });

  render();
})();
