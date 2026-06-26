import { type ReactElement, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MFAVerificationForm from "@/components/MFAVerificationForm/MFAVerificationForm";
import { getMfaStatus, startMfaDeviceSetup, verifyMfaDevice } from "@/api/account";
import { ApiErrorResponse } from "@/api/errors";
import { toast } from "sonner";

function extractSecret(otpauthUri: string): string {
    try {
        return new URL(otpauthUri).searchParams.get("secret") ?? "";
    } catch {
        return /[?&]secret=([^&]+)/.exec(otpauthUri)?.[1] ?? "";
    }
}

export default function MfaCard(): ReactElement {
    const { user } = useAuth();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getMfaStatus()
            .then((s) => setEnabled(s.enabled))
            .catch(() => setEnabled(null));
    }, []);

    async function handleStart(): Promise<void> {
        setLoading(true);
        setError(null);
        try {
            const setup = await startMfaDeviceSetup();
            setSecret(extractSecret(setup.otpauthUri));
        } catch (err) {
            toast.error(
                err instanceof ApiErrorResponse ? err.message : "Não foi possível iniciar a configuração",
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify(code: string): Promise<void> {
        setLoading(true);
        setError(null);
        try {
            await verifyMfaDevice(code);
            setSecret(null);
            setEnabled(true);
            toast.success("Dispositivo de autenticação atualizado");
        } catch (err) {
            setError(err instanceof ApiErrorResponse ? err.message : "Código inválido");
        } finally {
            setLoading(false);
        }
    }

    if (secret !== null) {
        return (
            <MFAVerificationForm
                email={user?.email ?? ""}
                secret={secret}
                onSubmit={handleVerify}
                loading={loading}
                error={error}
                onBack={() => {
                    setSecret(null);
                    setError(null);
                }}
                backLabel="← Cancelar"
            />
        );
    }

    return (
        <Card className="w-full max-w-sm py-0 gap-5 rounded">
            <CardHeader className="px-8 pt-6 pb-3 rounded">
                <h3 className="text-lg font-medium">Autenticação em duas etapas</h3>
            </CardHeader>
            <CardContent className="px-8 pb-8 grid gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {enabled === null ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : enabled ? (
                        <>
                            <ShieldCheck className="size-4 text-emerald-500" />
                            MFA ativado
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="size-4 text-amber-500" />
                            MFA não configurado
                        </>
                    )}
                </div>
                <Button
                    type="button"
                    onClick={() => void handleStart()}
                    disabled={loading}
                    className="w-full rounded"
                    style={{ background: "#d4a574", color: "#0f1117" }}
                >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {enabled ? "Trocar dispositivo" : "Configurar dispositivo"}
                </Button>
            </CardContent>
        </Card>
    );
}
