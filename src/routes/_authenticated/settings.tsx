import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CampusConnect" }] }),
  component: Settings,
});

function Settings() {
  const get = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const { data, refetch } = useQuery({ queryKey: ["my-profile"], queryFn: () => get() });

  const [fullName, setFullName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (data) {
      setFullName(data.full_name ?? "");
      setMajor(data.major ?? "");
      setYear(data.year_of_study ?? "");
      setBio(data.bio ?? "");
    }
  }, [data]);

  const save = async () => {
    try {
      await update({ data: { full_name: fullName, major, year_of_study: year, bio } });
      toast.success("Profile updated");
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update");
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Profile & settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update how other students see you.</p>

      <Card className="mt-6 space-y-4 border-border/60 bg-card/60 p-6 backdrop-blur">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="major">Major / field of study</Label>
            <Input id="major" value={major} onChange={(e) => setMajor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" placeholder="e.g. Junior" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        {data?.username && (
          <p className="text-xs text-muted-foreground">Public handle: @{data.username}</p>
        )}
        <Button onClick={save} className="gradient-primary text-primary-foreground hover:opacity-90">
          Save changes
        </Button>
      </Card>
    </main>
  );
}
