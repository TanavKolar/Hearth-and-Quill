import type {Metadata} from 'next';
import {Newsreader, Plus_Jakarta_Sans} from 'next/font/google';
import './globals.css'; // Global styles

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'User-Authenticated Gemini Reflections Journal',
  description: 'A secure, user-authenticated reflection journal powered by Gemini 3.6 Flash and Cloud Firestore with Google Sign-In and private user-isolated storage.',
  openGraph: {
    title: 'User-Authenticated Gemini Reflections Journal',
    description: 'A secure, user-authenticated reflection journal powered by Gemini 3.6 Flash and Cloud Firestore with Google Sign-In and private user-isolated storage.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'User-Authenticated Gemini Reflections Journal',
    description: 'A secure, user-authenticated reflection journal powered by Gemini 3.6 Flash and Cloud Firestore with Google Sign-In and private user-isolated storage.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${newsreader.variable} ${plusJakartaSans.variable}`}>
      <body suppressHydrationWarning className="bg-[#F9F7F2] text-[#3E3A35] antialiased selection:bg-[#DDBEA9] selection:text-[#4B4842]">
        {children}
      </body>
    </html>
  );
}
