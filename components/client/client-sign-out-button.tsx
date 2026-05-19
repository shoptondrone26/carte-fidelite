import { signOut } from "@/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClientSignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground",
        )}
      >
        Déconnexion
      </button>
    </form>
  );
}
