import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import styles from "./GlobalHeader.module.css";

interface GlobalHeaderProps {
    user?: {
        name: string;
        role: string;
        avatarUrl?: string;
    };
    className?: string;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function GlobalHeader({ user, className }: GlobalHeaderProps): React.JSX.Element {
    const { theme, toggleTheme } = useTheme();

    const defaultUser: NonNullable<GlobalHeaderProps["user"]> = {
        name: "Daniel Moura",
        role: "Consultor",
    };

    const currentUser: NonNullable<GlobalHeaderProps["user"]> = user ?? defaultUser;

    return (
        <header
            className={cn(
                "w-full px-6 lg:px-10 h-14 flex items-center justify-between mt-2",
                className
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 min-w-[140px]">
                <WssLogoIcon />
                <div className="flex flex-col leading-none">
                    <span className="text-primary font-bold text-base tracking-widest uppercase">
                        WSS
                    </span>
                    <span className="text-muted-foreground text-[9px] tracking-[0.25em] uppercase font-medium">
                        Sguardo
                    </span>
                </div>
            </div>

            {/* Slogan */}
            <p className="hidden sm:block !text-[15px] tracking-[0.3em] uppercase text-muted-foreground select-none">
                A Segurança Digital
                <span className={cn("text-primary mx-1", styles["slogan-dot"])}></span>
                Do Seu Mundo
            </p>

            {/* User area */}
            <div className="flex items-center gap-4 min-w-[140px] justify-end">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    aria-label="Alternar tema"
                    className="text-foreground hover:text-foreground/70 transition-colors duration-200"
                >
                    {theme === "dark" ? (
                        <Sun className="h-6 w-6" />
                    ) : (
                        <Moon className="h-6 w-6" />
                    )}
                </button>

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end text-right hidden sm:block leading-none">
                        <p className="!text-[10px] font-semibold text-foreground">
                            {currentUser.name}
                        </p>
                        <p className="!text-[9px] -mt-1 text-muted-foreground">
                            {currentUser.role}
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-muted border border-border">
                        {currentUser.avatarUrl ? (
                            <img
                                src={currentUser.avatarUrl}
                                alt={currentUser.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[11px] font-bold text-muted-foreground">
                                {getInitials(currentUser.name)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function WssLogoIcon(): React.JSX.Element {
    const cx = 20;
    const cy = 20;
    const r = 18;
    const sq = 26;
    const sqX = cx - sq / 2;
    const sqY = cy - sq / 2;

    return (
        <svg
            width="36"
            height="36"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-primary"
            />
            <rect
                x={sqX}
                y={sqY}
                width={sq}
                height={sq}
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-primary"
                fill="none"
            />
            <text
                x={cx}
                y={cy + 6}
                textAnchor="middle"
                fill="currentColor"
                fontSize="18"
                fontFamily="Georgia, serif"
                fontWeight="600"
                className="text-primary"
            >
                W
            </text>
        </svg>
    );
}