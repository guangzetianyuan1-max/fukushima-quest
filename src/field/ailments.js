// 癖で付いた状態の見せ方（本人 10/4「憑依されると、名前の脇に文字は出るが分かりにくい。HPを赤字にし、減っていることを知らせてほしい。他、癖がついたらわかるようにして欲しい」）
// 地図の上の札・戦いの画面の両方が ここを見る（画面と切り離して試験できる）
export const AILMENTS = {
  ghost: { badge: '憑', color: '#ff5a5a', name: '憑依', note: '歩くたびに HPが 1減る（寺の供養・神社の霊祓い）' },
  curse: { badge: '呪', color: '#c890ff', name: '呪い', note: 'ときどき 体が 動かない（神社の お祓い）' },
  stunned: { badge: '止', color: '#ffb050', name: '動けない', note: 'つぎの番は 動けない' },
  dead: { badge: '霊', color: '#9fd0ff', name: '幽霊', note: '戦いに出られない（寺社で 生き返る）' },
};
// 全員にかかる状態（戦いの中だけ・残りのターン数）
export const PARTY_STATES = {
  silence: { name: '術封じ', color: '#ffb050' },
  blind: { name: '目くらまし', color: '#ffe066' },
};

// 1人の印（並べる順は 幽霊 → 憑 → 呪 → 止）。p＝旅の状態の party の1人、または戦いの味方
export function badgesOf(p) {
  if (!p) return [];
  if (p.dead || p.alive === false) return ['dead'];
  return ['ghost', 'curse', 'stunned'].filter((k) => (k === 'stunned' ? (p.stunned ?? 0) > 0 : !!p[k]));
}

// HP の字の色：力つきた＝灰／⭐憑依＝赤（減り続けることを知らせる）／4割未満＝黄／ほか白
export function hpColor(p, max) {
  if (!p) return '#ffffff';
  if (p.dead || p.alive === false || p.hp <= 0) return '#9a9a9a';
  if (p.ghost) return '#ff5a5a';
  return p.hp / Math.max(1, max) < 0.4 ? '#ffd34d' : '#ffffff';
}

// 全員にかかる状態の札（例「術封じ あと3」）
export function partyStateLines(state) {
  return Object.entries(PARTY_STATES).filter(([k]) => (state?.[k] ?? 0) > 0).map(([k, s]) => ({ key: k, text: `${s.name} あと${state[k]}`, color: s.color }));
}
