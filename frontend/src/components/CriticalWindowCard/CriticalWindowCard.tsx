import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import styles from "./CriticalWindowCard.module.css";

export interface CriticalWindowItem {
    id: string | number;
    label: string;
    count: number;
    description: string;
}

interface CriticalWindowCardProps {
    label: string;
    count: number;
    description: string;
    className?: string;
}

export function CriticalWindowCard({
    label,
    count,
    description,
    className,
}: CriticalWindowCardProps): React.JSX.Element {
    return (
        <Card className={cn(styles.card, "min-w-[100px] flex-1 mx-auto", className)}>
            <CardContent className="flex flex-col gap-3 px-3 py-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="!text-[12px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                        {label}
                    </span>
                    <div className="relative h-10 w-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 rounded-lg" />
                        <FolderOpen className="h-6 w-6 text-primary relative z-10" />
                    </div>
                </div>

                <span className="!text-[36px] font-bold text-foreground leading-none">
                    {count}
                </span>

                <span className="!text-[14px] text-muted-foreground">
                    {description}
                </span>
            </CardContent>
        </Card>
    );
}