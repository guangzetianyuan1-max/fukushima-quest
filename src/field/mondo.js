// 問答の試し（本人 10/5 設計書「その章の昔話と土地の問い5つ・4つ正解で合格＝日本文化を学ぶ」）＝僧・陰陽師・薬師の師匠
// 問いは ゲームに入っている話（1章の4話の語り・補足・町の人・立て札）で確かめた事だけ。出どころの話を source に書く
// 計算は画面と切り離す（画面は FieldScene の startMondo）
export const MONDO_COUNT = 5;
export const MONDO_PASS = 4;
// 答えは 地図の選び1行（右へ はみ出さない）に入る長さ＝字の幅の見積もり 279 ドットまで（全角22・半角の空白11）
export const choiceWidth = (t) => [...t].reduce((w, ch) => w + (ch === ' ' ? 11 : 22), 0);
export const CHOICE_MAX = 279;

// ch → 師匠の職業 → 問い（a＝正しい答えの番号）
export const MONDO = {
  1: {
    sou: [
      { q: '大悲山の 薬師堂で 琵琶を 弾いていた 琵琶法師の 名は？', c: ['玉都', '祐慶', '頼義'], a: 0, source: 'daihisan' },
      { q: '大悲山の 池の 大蛇は、何に 化けて 玉都を たずねた？', c: ['若い 武士', '旅の 娘', '白い 鹿'], a: 0, source: 'daihisan' },
      { q: '大蛇は この 地を どうしたいと 打ち明けた？', c: ['大雨で 大沼に したい', '山を 崩したい', '城を 建てたい'], a: 0, source: 'daihisan' },
      { q: '小高の 殿様が 山や 谷に 打たせた、大蛇の 苦手な 物は？', c: ['鉄の 釘', '銀の 鈴', '松の 杭'], a: 0, source: 'daihisan' },
      { q: 'ザルカブリ山の 化け物に 会った 猟師は、それから どうした？', c: ['殺生を やめた', '山に 住んだ', '城に 仕えた'], a: 0, source: 'zarukaburi' },
      { q: 'ザルカブリ山の 化け物は、何の すがただと 伝わる？', c: ['山の 神さまの 戒め', '海から 来た 鬼', '城を 追われた 姫'], a: 0, source: 'zarukaburi' },
      { q: '小高城に 城を 置いた 相馬氏は、およそ 何年で 中村城へ 移った？', c: ['およそ 280年', 'およそ 30年', 'およそ 800年'], a: 0, source: 'kanban' },
    ],
    onmyo: [
      { q: '鹿狼山の 手長明神さまが 従えていたのは？', c: ['白い 鹿と 白い 狼', '黒い 熊と 鷹', '赤い 牛と 馬'], a: 0, source: 'tenaga' },
      { q: '海から 帰る 舟が 目印に した 山は？', c: ['鹿狼山', '虎捕山', '大悲山'], a: 0, source: 'tenaga' },
      { q: '新地の 貝塚は、何の 跡だと 伝わる？', c: ['食べた 貝を 捨てた 跡', '城の 堀の 跡', '大蛇の 寝床'], a: 0, source: 'tenaga' },
      { q: '平安の むかし、虎捕山に 隠れた 凶賊の 名は？', c: ['橘墨虎', '大多鬼丸', '玉都'], a: 0, source: 'sumitora' },
      { q: '源頼義を 墨虎の 隠れ家へ 導いたのは？', c: ['白い 狼の 足跡', '琵琶の 音', '海の 灯り'], a: 0, source: 'sumitora' },
      { q: '虎捕山の 山津見神社の 天井に 描かれている 物は？', c: ['狼の 絵', '龍の 絵', '桜の 絵'], a: 0, source: 'sumitora' },
      { q: '「虎捕山」の 名の いわれは？', c: ['墨虎を 捕らえたから', '虎が 住んでいたから', '虎の 形の 岩だから'], a: 0, source: 'sumitora' },
    ],
    kusushi: [
      { q: '大悲山の 薬師堂に まつられているのは、病を 治す どの 仏さま？', c: ['薬師さま', '大黒さま', '仁王さま'], a: 0, source: 'daihisan' },
      { q: '手長明神さまは、何を 見守る 神さま？', c: ['海と 山と 人の 暮らし', '城と 殿様だけ', '旅の 商人だけ'], a: 0, source: 'tenaga' },
      { q: '海から 帰った 漁師が 忘れなかった ことは？', c: ['海の めぐみへの 感謝', '獲物を 数える こと', '舟を 塗りかえる こと'], a: 0, source: 'tenaga' },
      { q: '相馬中村城跡に いま まつられているのは？', c: ['相馬中村神社', '山津見神社', '薬師堂'], a: 0, source: 'kanban' },
      { q: '松川浦の 入口の 岬に 立つ 灯台は？', c: ['鵜ノ尾埼灯台', '塩屋埼灯台', '小名浜灯台'], a: 0, source: 'kanban' },
      { q: 'ザルカブリ山の 化け物の 頭は、何の ような 形？', c: ['ざる', 'つぼ', 'かさ'], a: 0, source: 'zarukaburi' },
      { q: '虎捕山の 山津見神社に いまも ある 像は？', c: ['白い 狼の 像', '白い 馬の 像', '龍の 像'], a: 0, source: 'sumitora' },
    ],
  },
};

// 1回の問答：問いを MONDO_COUNT 個えらび、答えの並びも混ぜる（正しい答えの番号 a を つけ直す）
export function newMondo(ch, job, rng) {
  const bank = MONDO[ch]?.[job] ?? [];
  const pool = [...bank];
  const qs = [];
  while (qs.length < MONDO_COUNT && pool.length) {
    const q = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const order = q.c.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    qs.push({ q: q.q, c: order.map((i) => q.c[i]), a: order.indexOf(q.a) });
  }
  return { qs, at: 0, right: 0 };
}
// 答える（k＝えらんだ番号）
export function answerMondo(m, k) {
  const ok = m.qs[m.at]?.a === k;
  return { m: { ...m, at: m.at + 1, right: m.right + (ok ? 1 : 0) }, ok };
}
export const mondoDone = (m) => m.at >= m.qs.length;
export const mondoPassed = (m) => mondoDone(m) && m.right >= MONDO_PASS;
