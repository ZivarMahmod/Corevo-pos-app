"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, Info, AlertTriangle } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  terminalEnabled?: boolean;
  terminalProvider?: string;
  terminalApiKey?: string;
  terminalMerchantId?: string;
  sumupTestMode?: boolean;
  swishEnabled?: boolean;
  swishNumber?: string;
}

interface TenantSettingsProps {
  tenant: Tenant;
  onSave: (data: Partial<Tenant>) => Promise<void>;
}

export default function TenantSettings({ tenant, onSave }: TenantSettingsProps) {
  const [terminalForm, setTerminalForm] = useState({
    terminalEnabled: false,
    terminalProvider: "sumup",
    terminalApiKey: "",
    terminalMerchantId: "",
    sumupTestMode: true,
  });

  const [swishForm, setSwishForm] = useState({
    swishEnabled: false,
    swishNumber: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setTerminalForm({
        terminalEnabled: tenant.terminalEnabled ?? false,
        terminalProvider: tenant.terminalProvider ?? "sumup",
        terminalApiKey: tenant.terminalApiKey ?? "",
        terminalMerchantId: tenant.terminalMerchantId ?? "",
        sumupTestMode: tenant.sumupTestMode !== false,
      });
      setSwishForm({
        swishEnabled: tenant.swishEnabled ?? false,
        swishNumber: tenant.swishNumber ?? "",
      });
    }
  }, [tenant]);

  const handleTerminalSave = async () => {
    setSaving(true);
    try {
      await onSave(terminalForm);
    } finally {
      setSaving(false);
    }
  };

  const handleSwishSave = async () => {
    setSaving(true);
    try {
      await onSave(swishForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Betalterminal — ovanfor Swish, full bredd */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <div>
                <CardTitle>Betalterminal</CardTitle>
                <CardDescription>
                  Konfigurera kortbetalning via terminal
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={terminalForm.terminalEnabled}
              onCheckedChange={(checked) =>
                setTerminalForm((prev) => ({ ...prev, terminalEnabled: checked }))
              }
            />
          </div>
        </CardHeader>

        {terminalForm.terminalEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Leverantor</Label>
              <Select
                value={terminalForm.terminalProvider}
                onValueChange={(value) =>
                  setTerminalForm((prev) => ({
                    ...prev,
                    terminalProvider: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Valj leverantor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sumup">SumUp</SelectItem>
                  <SelectItem value="adyen">Adyen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {terminalForm.terminalProvider === "sumup" ? (
              <>
                {/* Bla info-box med 4 steg */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium">
                        Sa hittar du din API-nyckel:
                      </p>
                      <ol className="list-decimal space-y-1 pl-4">
                        <li>
                          Logga in pa{" "}
                          <span className="font-medium">me.sumup.com</span>
                        </li>
                        <li>
                          Ga till{" "}
                          <span className="font-medium">
                            Utvecklare &rarr; API-nycklar
                          </span>
                        </li>
                        <li>
                          Skapa en ny nyckel med behorighet for{" "}
                          <span className="font-medium">Payments</span>
                        </li>
                        <li>Kopiera nyckeln och klistra in den nedan</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Grid: API-nyckel + Merchant Code */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sumup-api-key">API-nyckel</Label>
                    <Input
                      id="sumup-api-key"
                      type="password"
                      placeholder="sup_sk_..."
                      className="font-mono"
                      value={terminalForm.terminalApiKey}
                      onChange={(e) =>
                        setTerminalForm((prev) => ({
                          ...prev,
                          terminalApiKey: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sumup-merchant-code">
                      Merchant Code{" "}
                      <span className="text-muted-foreground">(valfritt)</span>
                    </Label>
                    <Input
                      id="sumup-merchant-code"
                      placeholder="M1CYFQRB"
                      className="font-mono"
                      value={terminalForm.terminalMerchantId}
                      onChange={(e) =>
                        setTerminalForm((prev) => ({
                          ...prev,
                          terminalMerchantId: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Testlage-toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Testlage</Label>
                    <p className="text-sm text-muted-foreground">
                      Inga riktiga pengar dras
                    </p>
                  </div>
                  <Switch
                    checked={terminalForm.sumupTestMode}
                    onCheckedChange={(checked) =>
                      setTerminalForm((prev) => ({
                        ...prev,
                        sumupTestMode: checked,
                      }))
                    }
                  />
                </div>

                {/* Gul varningsruta nar testlage ar pa */}
                {terminalForm.sumupTestMode && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Testlage ar aktiverat — inga riktiga transaktioner
                        kommer att genomforas. Stang av testlage innan du gar
                        live.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Generiska falt for andra leverantorer */}
                <div className="space-y-2">
                  <Label htmlFor="terminal-api-key">API-nyckel</Label>
                  <Input
                    id="terminal-api-key"
                    type="password"
                    value={terminalForm.terminalApiKey}
                    onChange={(e) =>
                      setTerminalForm((prev) => ({
                        ...prev,
                        terminalApiKey: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terminal-merchant-id">Merchant ID</Label>
                  <Input
                    id="terminal-merchant-id"
                    value={terminalForm.terminalMerchantId}
                    onChange={(e) =>
                      setTerminalForm((prev) => ({
                        ...prev,
                        terminalMerchantId: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleTerminalSave}
              disabled={!terminalForm.terminalApiKey || saving}
            >
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Swish — precis under Betalterminal, full bredd */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <div>
                <CardTitle>Swish</CardTitle>
                <CardDescription>
                  Ta emot betalningar via Swish
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={swishForm.swishEnabled}
              onCheckedChange={(checked) =>
                setSwishForm((prev) => ({ ...prev, swishEnabled: checked }))
              }
            />
          </div>
        </CardHeader>

        {swishForm.swishEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="swish-number">Swish-nummer</Label>
              <Input
                id="swish-number"
                placeholder="123 456 78 90"
                value={swishForm.swishNumber}
                onChange={(e) =>
                  setSwishForm((prev) => ({
                    ...prev,
                    swishNumber: e.target.value,
                  }))
                }
              />
            </div>
            <Button onClick={handleSwishSave} disabled={saving}>
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
