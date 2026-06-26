import { Inter } from 'next/font/google';
import './global.css';
import QueryProvider from '../lib/providers/QueryProvider';
// @ts-ignore: no type declarations for leaflet CSS side-effect import
import 'leaflet/dist/leaflet.css';

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
