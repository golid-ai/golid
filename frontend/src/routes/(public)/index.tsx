import { Title } from "@solidjs/meta";
import { Button } from "~/components/atoms/Button";

export default function Home() {
  return (
    <>
      <Title>Golid</Title>
      <div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-6">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
          Golid
        </h1>
        <p class="text-lg text-muted-foreground mb-8 max-w-md">
          A production-ready Go + SolidJS template with auth, 70+ components, and Cloud Run deployment.
        </p>
        <div class="flex gap-3">
          <Button href="/signup" size="lg">
            Get Started
          </Button>
          <Button href="/login" variant="outline" size="lg">
            Login
          </Button>
        </div>
      </div>
    </>
  );
}
