import { For } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Card } from "~/components/atoms/Card";
import { Icon } from "~/components/atoms/Icon";
import { auth } from "~/lib/auth";

const quickLinks = [
  { href: "/settings", icon: "settings", label: "Settings", desc: "Update your profile and password", adminOnly: false },
  { href: "/components", icon: "widgets", label: "Components", desc: "Browse 70+ UI components", adminOnly: true },
];

export default function Dashboard() {
  return (
    <>
      <Title>Dashboard | Golid</Title>
      <div class="p-6 sm:p-10 max-w-[1400px] mx-auto w-full space-y-6">
        <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>

        {/* Welcome */}
        <Card class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-cta-green/10 flex items-center justify-center shrink-0">
              <Icon name="waving_hand" size={24} class="text-cta-green" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-foreground">
                Welcome{auth.user?.first_name ? `, ${auth.user.first_name}` : ""}!
              </h2>
              <p class="text-sm text-muted-foreground">{auth.user?.email}</p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={quickLinks.filter((l) => !l.adminOnly || auth.isAdmin)}>{(link) => (
            <A href={link.href} class="group">
              <Card class="p-5 h-full transition-colors hover:border-cta-green/30">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-cta-green/10 transition-colors">
                    <Icon name={link.icon} size={20} class="text-muted-foreground group-hover:text-cta-green transition-colors" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-foreground">{link.label}</h3>
                    <p class="text-sm text-muted-foreground mt-0.5">{link.desc}</p>
                  </div>
                </div>
              </Card>
            </A>
          )}</For>

          {/* Placeholder for your first feature */}
          <Card class="p-5 border-dashed">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                <Icon name="add" size={20} class="text-muted-foreground" />
              </div>
              <div>
                <h3 class="font-semibold text-foreground">Your Feature</h3>
                <p class="text-sm text-muted-foreground mt-0.5">
                  Run <code class="text-xs bg-foreground/5 px-1.5 py-0.5 rounded">make new-module name=notes</code> to scaffold
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Account Info */}
        <Card class="p-6">
          <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Account</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-muted-foreground">Role</p>
              <p class="text-sm font-medium text-foreground capitalize">{auth.user?.type || "user"}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Email Verified</p>
              <p class="text-sm font-medium text-foreground">{auth.user?.email_verified ? "Yes" : "No"}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Member Since</p>
              <p class="text-sm font-medium text-foreground">
                {auth.user?.created_at
                  ? new Date(auth.user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
