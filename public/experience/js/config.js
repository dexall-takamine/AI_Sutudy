/* =========================================================
   config.js — シーン定義・トークン・統計・解説テキスト
   ここを書き換えるだけで内容を調整できます（データ駆動）
   グローバル名前空間 AIX に集約
   ========================================================= */
window.AIX = window.AIX || {};

AIX.CONFIG = {
  question: 'このあと雨は降りますか？',
  answer: '今日は雨が降る可能性があります。',
  // Tokenization で表示するトークン
  tokens: ['この', 'あと', '雨', 'は', '降ります', 'か', '？'],
  modelName: 'Demo-LLM (12 layers)',
  layers: 12,

  // 配色（近未来・ネオン）
  color: {
    cyan: 0x36e0ff, blue: 0x3b6bff, purple: 0x9a6bff,
    pink: 0xff5bd0, white: 0xffffff, dim: 0x6a7390,
    bg: 0x05060d
  },

  // 10シーン定義（左フロー・右解説・上ステータスに使用）
  scenes: [
    { id: 'input',      no: 1,  title: '① ユーザー入力',       sub: 'Input',
      desc: 'あなたの質問「このあと雨は降りますか？」がAIに届きます。文字の列（テキスト）が、光の粒（データ）となってAIへ流れ込みます。',
      proc: 'テキスト受信', dur: 3.4 },
    { id: 'token',      no: 2,  title: '② トークン分割',       sub: 'Tokenization',
      desc: '文章を、AIが扱える小さな単位「トークン」に切り分けます。単語や文字のかたまりごとに分かれ、ひとつずつの立方体になります。',
      proc: 'Tokenization', dur: 4.0 },
    { id: 'embed',      no: 3,  title: '③ ベクトル化',         sub: 'Embedding',
      desc: '各トークンを「意味を表す数字の並び（ベクトル）」に変換します。意味が近い言葉ほど、宇宙のような空間の中で近くに集まります。',
      proc: 'Embedding', dur: 4.6 },
    { id: 'transformer',no: 4,  title: '④ Transformer',        sub: 'Layers',
      desc: '何層も積み重なったAIの中核を通り抜けます。層（Layer）を通るたびに、言葉の意味の理解が少しずつ深まっていきます。',
      proc: 'Transformer 12層', dur: 4.4 },
    { id: 'attention',  no: 5,  title: '⑤ Attention',          sub: 'どの語が重要か',
      desc: '「雨」と「このあと」のように、関係の深い言葉どうしが線で結ばれます。重要なつながりほど、線は太く明るくなります。これがAIの“注目”です。',
      proc: 'Attention', dur: 4.6 },
    { id: 'knowledge',  no: 6,  title: '⑥ 知識検索',           sub: 'Knowledge',
      desc: 'AIの中の膨大な知識ネットワークから、質問に関係するノードだけが光ります。（外部DBを使うRAGでは、ここで社外の情報も参照します）',
      proc: 'Knowledge Lookup', dur: 4.0 },
    { id: 'inference',  no: 7,  title: '⑦ 推論',               sub: 'Reasoning',
      desc: '「天気」「時刻」「場所」「質問の意図」を統合して、答えを組み立てます。歯車とニューラルネットが回り、考えがまとまっていきます。',
      proc: 'Reasoning', dur: 4.0 },
    { id: 'predict',    no: 8,  title: '⑧ 単語予測',           sub: 'Token Prediction',
      desc: '回答を1トークンずつ予測して生成します。「今」→「今日は」→「今日は雨」… と、確率の高い続きを選びながら文章を作ります。',
      proc: 'Token Prediction', dur: 5.0 },
    { id: 'response',   no: 9,  title: '⑨ ユーザーへ返却',     sub: 'Response',
      desc: '完成した回答が、AIコアから光となってチャット画面へ戻り、表示されます。',
      proc: 'Response', dur: 3.6 },
    { id: 'log',        no: 10, title: '⑩ 内部ログ',           sub: 'Summary',
      desc: 'AI内部で実行された処理の一覧です。たった一つの質問の裏で、これだけの工程が一瞬で動いています。',
      proc: 'Done', dur: 4.5 }
  ],

  // クリック解説（オブジェクトをクリックで表示）
  glossary: {
    token:      { t: 'トークンとは？', d: 'AIが文章を扱う最小単位。単語や文字のかたまり。AIは文章そのものではなく、トークンの列として処理します。' },
    embedding:  { t: 'Embeddingとは？', d: '言葉の意味を数百〜数千個の数字（ベクトル）で表す技術。意味が近い言葉ほどベクトルも近くなります。' },
    transformer:{ t: 'Transformerとは？', d: '2017年に登場したAIの中核構造。多数の層で文章の文脈を捉え、現在の生成AIの土台になっています。' },
    attention:  { t: 'Attentionとは？', d: '文中のどの言葉が、どの言葉と関係が深いかを計算するしくみ。重要な語に“注目”して意味を読み取ります。' },
    knowledge:  { t: '知識ネットワークとは？', d: '学習で得た知識のつながり。質問に関連する部分が呼び出されて回答に使われます。' },
    inference:  { t: '推論とは？', d: '複数の情報を統合し、確率的にもっともらしい答えを組み立てる工程です。' }
  }
};
