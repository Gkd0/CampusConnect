import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Zap, MessagesSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusConnect — Student marketplace & skill swap" },
      { name: "description", content: "Buy textbooks, swap skills, and connect with fellow students. A modern peer-to-peer marketplace built for campus life." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <section className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for students
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Your campus, <span className="text-gradient-primary">connected.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Buy and sell textbooks, electronics, and dorm gear. Swap skills with classmates —
            tutoring, coding help, design, and more. All on one minimalist hub.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground hover:opacity-90">
              <Link to="/signup">Get started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">Browse the feed</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: "Textbooks & gear", desc: "Skip the campus bookstore markup. Buy local, save fast." },
            { icon: Zap, title: "Skill swaps", desc: "Trade tutoring for code reviews. Earn while you learn." },
            { icon: MessagesSquare, title: "Realtime chat", desc: "Negotiate, coordinate pickups, message instantly." },
            { icon: Heart, title: "Save favorites", desc: "Keep a watchlist of listings you're eyeing." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur transition-colors hover:border-primary/40">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
