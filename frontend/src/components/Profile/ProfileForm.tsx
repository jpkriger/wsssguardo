import { type ReactElement, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProfileFormProps {
    onChangePassword: () => void;
}

export default function ProfileForm({ onChangePassword }: ProfileFormProps): ReactElement {
    const { user } = useAuth();
    const [name, setName] = useState(
        user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "",
    );
    const [loading, setLoading] = useState(false);

    if (!user) return <div />;

    function handleSave(e?: React.FormEvent) {
        e?.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Alterações salvas");
        }, 700);
    }

    return (
        <Card className="w-full max-w-sm py-0 gap-0 rounded">
            <CardHeader className="px-8 pt-8 pb-5 text-center">
                <div className="w-16 h-16 rounded-full bg-foreground/10 mx-auto flex items-center justify-center">
                    <p className="text-xl opacity-70">
                        {user.firstName?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
                        {user.lastName?.charAt(0) ?? ""}
                    </p>
                </div>

                <h2 className="text-2xl font-normal text-foreground leading-tight mt-4">Perfil do Usuário</h2>
            </CardHeader>

            <CardContent className="px-8 pb-8">
                <form className="grid gap-4" onSubmit={handleSave}>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" className="rounded" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" className="rounded" value={user.email ?? ""} disabled />
                    </div>

                    <button
                        type="button"
                        onClick={onChangePassword}
                        className="text-left text-sm text-[#d4a574] hover:opacity-90 transition-colors"
                    >
                        Alterar senha
                    </button>

                    <div className="pt-1">
                        <Button
                            type="submit"
                            className="w-full mt-1 rounded"
                            style={{ background: "#d4a574", color: "#0f1117" }}
                            disabled={loading}
                        >
                            Salvar alterações
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
