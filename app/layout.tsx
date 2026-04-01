import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-display',
    subsets: ['latin'],
});

const plusJakartaMono = Plus_Jakarta_Sans({
    variable: '--font-mono',
    subsets: ['latin'],
});

const plusJakartaSerif = Plus_Jakarta_Sans({
    variable: '--font-serif',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Akaal tee-am',
    description: 'Akaal tee-am Application',
    manifest: '/manifest.json',
    icons: {
        icon: '/icon/mono-akaal-logo.png',
        shortcut: '/icon/mono-akaal-logo.png',
        apple: '/icon/mono-akaal-logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${plusJakartaSans.variable} ${plusJakartaSerif.variable} ${plusJakartaMono.variable}`}>
            <body>
                {children}
            </body>
        </html>
    );
}
