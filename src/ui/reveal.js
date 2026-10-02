// 紙芝居の字幕を、語りの声に合わせて少しずつ出す（本人 10/3「しおりの昔話のナレーションと下の字幕の表示スピードを合わせて」）
// pages＝窓に収まる分けた文（paginate）。progress＝声の進み 0〜1 → いま見せるページと、その頭からの文
// 声の長さは字の数にほぼ比例する＝分かち書きの空白は数えない
export function revealAt(pages, progress) {
  const count = (s) => [...s].filter((ch) => ch !== ' ').length;
  const total = pages.reduce((n, p) => n + count(p), 0);
  let left = Math.round(Math.min(1, Math.max(0, progress)) * total);
  for (let i = 0; i < pages.length; i++) {
    const n = count(pages[i]);
    if (left <= n || i === pages.length - 1) {
      const chars = [...pages[i]];
      let k = 0;
      let seen = 0;
      while (k < chars.length && seen < left) { if (chars[k] !== ' ') seen++; k++; }
      return { page: i, text: chars.slice(0, k).join('') };
    }
    left -= n;
  }
  return { page: 0, text: '' };
}
