export const metadata = {
  title: '生成AI・AIエージェント完全入門',
  description: '仕組みから実践まで体系的に学ぶオンライン教材',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
