/**
 * Verifies the TypeScript runtime reproduces the Python-trained model exactly.
 * Run: npx tsx scripts/verify-model.ts
 * The labels printed here MUST match the [sanity] block from train_model.py.
 */
import { MODEL } from '../api/_lib/ai/nlp/model';
import { predict } from '../api/_lib/ai/nlp/training/trainer';

const PROBES: [string, string][] = [
  ['Bitcoin spot ETF receives official SEC approval, market rallies', 'positive'],
  ['$BTC.X looks like people are dumping to buy bubble AI stocks instead', 'negative'],
  ['$BTC.X why does Saylor keep all these bitcoins? The only reason is to sell', 'negative'],
  ["$BTC.X get ready for 50k folks - I'm selling 32 bitcoin today", 'negative'],
  ['$BTC.X who putting in there Bitcoin buy orders?', 'neutral'],
  ['$BTC.X well when all the retailers start saying a coin is done that indicates a bottom', 'positive'],
  ['Bearish. $BTC.X if selling 10 coins drops it 14% what is it actually worth', 'negative'],
  ['Solana hits a new all-time high as ETF inflows surge', 'positive'],
  ['should I buy or wait on ETH here?', 'neutral'],
  ['not bullish on DOGE at all, the chart is broken', 'negative'],
  ['this is not a scam, SOL is a solid project', 'positive'],
  ['major exchange hacked, millions stolen, panic selling', 'negative'],
];

let ok = 0;
console.log(`model: ${MODEL.algorithm} v${MODEL.version} | vocab ${MODEL.vocabulary.length}`);
for (const [text, exp] of PROBES) {
  const p = predict(MODEL, text);
  const mark = p.label === exp ? 'OK ' : 'XX ';
  if (p.label === exp) ok++;
  console.log(`  ${mark} ${p.label.padEnd(8)} P=${(p.confidence * 100).toFixed(0)}% exp=${exp.padEnd(8)} | ${text.slice(0, 56)}`);
}
console.log(`${ok}/${PROBES.length} match expected`);
