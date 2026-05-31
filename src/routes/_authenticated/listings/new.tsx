import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Package, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ITEM_CATEGORIES, SKILL_CATEGORIES, CONDITIONS, formatPriceLabel } from "@/lib/listing-constants";
import { createListing } from "@/lib/listings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/listings/new")({
  head: () => ({ meta: [{ title: "New listing — CampusConnect" }] }),
  component: NewListing,
});

function NewListing() {
  const navigate = useNavigate();
  const create = useServerFn(createListing);
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"item" | "skill" | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<string>("good");
  const [description, setDescription] = useState("");
  const [pricing, setPricing] = useState<"price" | "free" | "trade" | "swap">("price");
  const [price, setPrice] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addImage = () => {
    const v = imageUrl.trim();
    if (!v) return;
    try { new URL(v); } catch { toast.error("Enter a valid image URL"); return; }
    if (images.length >= 6) return;
    setImages([...images, v]);
    setImageUrl("");
  };

  const cats = type === "skill" ? SKILL_CATEGORIES : ITEM_CATEGORIES;
  const progress = (step / 4) * 100;

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v) && tags.length < 10) setTags([...tags, v]);
    setTagInput("");
  };

  const submit = async () => {
    if (!type) return;
    setSubmitting(true);
    try {
      const priceCents = pricing === "price" && price ? Math.round(parseFloat(price) * 100) : null;
      const priceLabel = formatPriceLabel({ priceCents, freeOrTrade: pricing, type });
      const res = await create({
        data: {
          type,
          category,
          condition: type === "item" ? (condition as any) : null,
          title,
          description,
          price_cents: priceCents,
          price_label: priceLabel,
          tags,
          images: [],
        },
      });
      toast.success("Listing posted!");
      navigate({ to: "/listings/$listingId", params: { listingId: res.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext =
    (step === 1 && !!type) ||
    (step === 2 && title.length >= 3 && !!category && (type === "skill" || !!condition)) ||
    (step === 3 && (pricing !== "price" || (!!price && parseFloat(price) >= 0))) ||
    step === 4;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of 4</p>
        <Progress value={progress} className="mt-2 h-1.5" />
      </div>

      <Card className="border-border/60 bg-card/70 p-6 backdrop-blur sm:p-8">
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl font-bold">What are you posting?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick the type that fits best.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { v: "item", icon: Package, t: "An item", d: "Textbooks, electronics, dorm gear" },
                { v: "skill", icon: Sparkles, t: "A skill", d: "Tutoring, coding, design help" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setType(o.v as any)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    type === o.v ? "border-primary bg-primary/10 glow-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <o.icon className="h-6 w-6 text-primary" />
                  <p className="mt-3 font-display text-base font-semibold">{o.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.d}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Tell us about it</h2>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "skill" ? "e.g. Calc II tutoring, 2 yrs experience" : "e.g. Intro to Algorithms textbook"} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {type === "item" && (
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add condition notes, what you're looking for, availability…" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Price & tags</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { v: "price", t: "Set price" },
                { v: "free", t: "Free" },
                { v: "trade", t: "Trade" },
                { v: "swap", t: "Skill swap" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setPricing(o.v as any)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                    pricing === o.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
            {pricing === "price" && (
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹ INR)</Label>
                <Input id="price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 499" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. CS101, hardcover" />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label="Remove tag">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl font-bold">Review</h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              <Row label="Type" value={type === "skill" ? "Skill" : "Item"} />
              <Row label="Title" value={title} />
              <Row label="Category" value={category} />
              {type === "item" && <Row label="Condition" value={CONDITIONS.find((c) => c.value === condition)?.label ?? ""} />}
              <Row label="Price" value={formatPriceLabel({ priceCents: pricing === "price" && price ? Math.round(parseFloat(price) * 100) : null, freeOrTrade: pricing, type: type ?? "item" })} />
              <Row label="Tags" value={tags.join(", ") || "—"} />
              <Row label="Description" value={description || "—"} />
            </dl>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="gradient-primary text-primary-foreground hover:opacity-90">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="gradient-primary text-primary-foreground hover:opacity-90">
              <Check className="h-4 w-4" /> {submitting ? "Posting…" : "Publish"}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
