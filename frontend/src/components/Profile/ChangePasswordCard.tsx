import { type ReactElement, useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChangePasswordCard(): ReactElement {
    const [current, setCurrent] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (password === "" || password !== confirm) {
            toast.error("Senhas precisam coincidir");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setCurrent("");
            setPassword("");
            setConfirm("");
            toast.success("Senha alterada com sucesso (simulada)");
        }, 800);
    }

    return (
        <Card className="w-full max-w-sm py-0 gap-5 rounded">
            <CardHeader className="px-8 pt-6 pb-3 rounded">
                <h3 className="text-lg font-medium">Alterar senha</h3>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="current">Senha atual</Label>
                        <Input className="rounded"id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="new">Nova senha</Label>
                        <Input className="rounded" id="new" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirmar senha</Label>
                        <Input className="rounded" id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>

                    <Button type="submit" className="w-full mt-1 rounded" disabled={loading} style={{ background: "#d4a574", color: "#0f1117" }}>
                        Alterar senha
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
