// 龍燈の龍（正面）。左半分16列×28行。右半分は鏡に映して作る。
// h=角 m=たてがみ o=輪郭 b=体 d=体の影 e=目 w=ひげ f=牙
export const DRAGON_HALF = [
  '...h............',
  '...hh...........',
  '....hh..........',
  '.....hh...mmm...',
  '......hhmmmmmmm.',
  '.....mmmmooooooo',
  '....mmmoobbbbbbb',
  '...mmmobbbbbbbbb',
  '..mmmobbbeeebbbb',
  '..mmobbbbeebbbbb',
  '.mmmobbbbbbbbbbb',
  '.mmobbbdbbbbbbbb',
  'wwwobbbbdbbbbbbb',
  '..wwobbbbbdddbbb',
  '....wobbbbbbbbbb',
  '....obbbbbbbbbbb',
  '.....obfbbbbbbbb',
  '.....obffbbbbbbb',
  '......obbffffffb',
  '.......obbbbbbbb',
  '........oooooooo',
  '....dd.....obbbb',
  '...dbbd....obbbb',
  '..dbbbbd...obbbb',
  '..dbbbbbd..obbbb',
  '...dbbbbbddbbbbb',
  '....ddbbbbbbbbbb',
  '......dddddddddd',
];

// 呑まれた姿：黒紫の体・赤い目
export const DRAGON_DARK = {
  o: 0x0b0614, b: 0x2a1d3d, d: 0x170f24, e: 0xff3b3b,
  h: 0x4a3a5c, m: 0x3a1f4f, w: 0x5a4a6a, f: 0xd8d0e0,
};

// 元の姿：青い体・金の目・白いたてがみ
export const DRAGON_LIGHT = {
  o: 0x0c2f4a, b: 0x3a8fd8, d: 0x2a6aa8, e: 0xffd34d,
  h: 0xf2e6c9, m: 0xe8f4ff, w: 0xf2e6c9, f: 0xffffff,
};
