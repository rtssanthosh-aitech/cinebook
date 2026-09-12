import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "CineBook | Premier Cinema Ticket Booking Experience",
  description: "Book movie tickets, choose VIP recliners, experience IMAX and Dolby Atmos with guaranteed zero duplicate seat locks on CineBook.",
  keywords: ["cinema tickets", "movie booking", "IMAX", "Dolby Atmos", "film showtimes", "seat reservation"],
  openGraph: {
    title: "CineBook - Cinema Ticket Booking",
    description: "Experience the next evolution of movie theater booking.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
