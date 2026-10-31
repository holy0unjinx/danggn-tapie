import './snapshot.css';
import styles from '../data/styles.json';
import articleStyles from '../data/article-styles.json';
import RelativeTimes from './relative-times';

export const metadata = {
  title: '당근 중고거래',
  description: '정자동 중고거래 검색 결과',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko-KR" data-carotene="" data-carotene-color-mode="light" data-seed="" data-seed-color-mode="system" data-seed-user-color-scheme="light" data-seed-platform="ios">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        {styles.map((name) => <link key={name} rel="stylesheet" href={`/snapshot/${name}`} />)}
        {articleStyles.map((name) => <link key={name} rel="stylesheet" href={`/article/${name}`} />)}
      </head>
      <body>
        {children}
        <RelativeTimes />
      </body>
    </html>
  );
}
