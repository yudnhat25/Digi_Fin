import { Hono } from 'hono';
import { getBankAccount, recordBankTxn, saveBankToFirebase } from '../state';
import { convert, getRates } from '../fx';

/**
 * CoinWise Bank — simulated VND retail bank.
 *
 * Powers the standalone bank web (separate front-end) and acts as the money
 * rail for the Arena: entry fees are debited here and prizes are credited here.
 * All amounts are stored in VND (the local currency); USD figures are derived
 * on the fly through the FX engine so the same /fx bridge that the rest of the
 * app uses stays the single conversion authority.
 */
export const bankRouter = new Hono();

const DEFAULT_ENTRY_FEE_USD = 5;

function usdToVnd(usd: number): { vnd: number; rate: number } {
  const r = convert(usd, 'USD', 'VND');
  return { vnd: r.result, rate: r.rate };
}

async function summary(accountId: string, holder?: string) {
  const acc = await getBankAccount(accountId, holder);
  const rate = getRates().rates.VND;
  return {
    accountId: acc.accountId,
    holder: acc.holder,
    bankAccountNo: acc.bankAccountNo,
    balanceVnd: acc.balanceVnd,
    balanceUsd: Number((acc.balanceVnd / rate).toFixed(2)),
    rate,
    openedAt: acc.openedAt,
  };
}

// ───── Account info ─────
bankRouter.get('/:id', async (c) => c.json(await summary(c.req.param('id'))));

bankRouter.get('/:id/statement', async (c) => {
  const acc = await getBankAccount(c.req.param('id'));
  return c.json(acc.transactions.slice(-100).reverse());
});

// ───── Deposit (top up) ─────
bankRouter.post('/:id/deposit', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { amountVnd?: number; holder?: string };
  const amt = Math.round(Number(body.amountVnd));
  if (!Number.isFinite(amt) || amt <= 0) return c.json({ error: 'amountVnd must be a positive number' }, 400);
  if (amt > 1_000_000_000) return c.json({ error: 'amountVnd exceeds 1,000,000,000 demo limit' }, 400);
  const acc = await getBankAccount(id, body.holder);
  acc.balanceVnd += amt;
  const txn = recordBankTxn(acc, 'DEPOSIT', amt, 'Nạp tiền vào tài khoản');
  await saveBankToFirebase(acc);
  return c.json({ ok: true, ...(await summary(id)), ref: txn.ref, transaction: txn });
});

// ───── Withdraw ─────
bankRouter.post('/:id/withdraw', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { amountVnd?: number };
  const amt = Math.round(Number(body.amountVnd));
  if (!Number.isFinite(amt) || amt <= 0) return c.json({ error: 'amountVnd must be a positive number' }, 400);
  const acc = await getBankAccount(id);
  if (acc.balanceVnd < amt) {
    return c.json({ ok: false, error: 'Số dư không đủ', balanceVnd: acc.balanceVnd, required: amt }, 402);
  }
  acc.balanceVnd -= amt;
  const txn = recordBankTxn(acc, 'WITHDRAW', -amt, 'Rút tiền khỏi tài khoản');
  await saveBankToFirebase(acc);
  return c.json({ ok: true, ...(await summary(id)), ref: txn.ref, transaction: txn });
});

// ───── Arena: pay entry fee (debit) ─────
bankRouter.post('/arena/pay-entry', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    accountId?: string; holder?: string; amountUsd?: number; room?: string;
  };
  if (!body.accountId) return c.json({ error: 'accountId required' }, 400);
  const usd = Number.isFinite(body.amountUsd) && Number(body.amountUsd) > 0 ? Number(body.amountUsd) : DEFAULT_ENTRY_FEE_USD;
  const acc = await getBankAccount(body.accountId, body.holder);
  const { vnd, rate } = usdToVnd(usd);
  if (acc.balanceVnd < vnd) {
    return c.json(
      { ok: false, paid: false, error: 'Số dư ngân hàng không đủ để thanh toán phí tham gia', requiredVnd: vnd, amountUsd: usd, balanceVnd: acc.balanceVnd },
      402,
    );
  }
  acc.balanceVnd -= vnd;
  const txn = recordBankTxn(acc, 'ARENA_ENTRY', -vnd, `Phí tham gia Arena${body.room ? ` · ${body.room}` : ''} ($${usd})`);
  await saveBankToFirebase(acc);
  return c.json({ ok: true, paid: true, amountUsd: usd, amountVnd: vnd, rate, ref: txn.ref, ...(await summary(body.accountId)) });
});

// ───── Arena: pay out prize (credit) ─────
bankRouter.post('/arena/payout', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    accountId?: string; holder?: string; amountUsd?: number;
  };
  if (!body.accountId) return c.json({ error: 'accountId required' }, 400);
  const usd = Number(body.amountUsd);
  if (!Number.isFinite(usd) || usd <= 0) return c.json({ error: 'amountUsd must be a positive number' }, 400);
  const acc = await getBankAccount(body.accountId, body.holder);
  const { vnd, rate } = usdToVnd(usd);
  acc.balanceVnd += vnd;
  const txn = recordBankTxn(acc, 'ARENA_PRIZE', vnd, `Tiền thưởng Arena ($${usd})`);
  await saveBankToFirebase(acc);
  return c.json({ ok: true, credited: true, amountUsd: usd, amountVnd: vnd, rate, ref: txn.ref, ...(await summary(body.accountId)) });
});
