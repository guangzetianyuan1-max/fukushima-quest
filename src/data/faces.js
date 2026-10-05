// 会話の顔絵が届いている仲間（art_src/prep_faces.py が書き換える）。しおりは face_normal ほか3つの表情（prep_cards.py）
// 本人 10/3「どうぐ→そうびを見る。しおり以外顔が無い。みんな顔をつけて」
export const FACE_IDS = ['tabi', 'kariudo', 'sou', 'job_bushi', 'job_sou', 'job_rikishi', 'job_yumi', 'job_onmyo', 'job_yamabushi', 'job_yojutsu', 'job_ninja', 'job_miko', 'job_kusushi'];
// くノ一になった しおりの顔（normal・surprise・sad＝assets/cards/face_k_<表情>.png）。届いた表情だけ並べる（10/4 夜・届く前は 浴衣の しおりの顔のまま）
export const KUNOICHI_FACES = []; // ⛔10/5 職業の旅で くノ一の変身は使わない＝読まない（Artifact の部品の数を空ける・絵は assets/cards/face_k_*.png に残す）
export const KUNOICHI_FACES_OLD = ['normal', 'surprise', 'sad']; // 10/4 夜 jks0d7（3D調で届いた＝そのまま96pxに縮めた・仮）
