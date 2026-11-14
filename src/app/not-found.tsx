import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LinkButton } from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 items-center bg-cream">
        <div className="container-site py-20 text-center">
          <p className="font-display text-[8rem] leading-none font-extrabold text-brand sm:text-[11rem]">404</p>
          <h1 className="mt-2 text-4xl font-extrabold">This page has been swept away</h1>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">We couldn&apos;t find what you were looking for. It may have moved, or the link might be mistyped.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/">Back to home</LinkButton>
            <LinkButton href="/domestic-cleaning" variant="outline">
              Browse services
            </LinkButton>
          </div>
          <p className="mt-6 text-sm text-muted">
            Need help? <Link href="/help" className="font-semibold underline">Visit the help centre</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
