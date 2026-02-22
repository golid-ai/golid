interface ComingSoonProps {
  title: string;
  icon: string;
}

export function ComingSoon(props: ComingSoonProps) {
  return (
    <div class="flex flex-1 items-center justify-center px-4 py-20">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground/[0.03] border border-foreground/10">
          <span
            class="material-symbols-rounded text-muted-foreground/40"
            style={{ "font-size": "40px" }}
          >
            {props.icon}
          </span>
        </div>
        <h1 class="text-2xl font-bold font-montserrat text-foreground">{props.title}</h1>
        <p class="text-muted-foreground text-sm max-w-xs mx-auto">
          This section is under development. Check back soon.
        </p>
      </div>
    </div>
  );
}
