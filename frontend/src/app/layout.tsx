import { Inter } from 'next/font/google';
import './global.css';
import QueryProvider from '../lib/providers/QueryProvider';


const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DispatchIQ',
  description: 'Dispatching and routing management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
