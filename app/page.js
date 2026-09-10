import { redirect } from 'next/navigation';

// ルート（/）にアクセスしたら教材トップ（public/index.html）へ
export default function Home() {
  redirect('/index.html');
}
