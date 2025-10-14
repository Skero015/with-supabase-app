"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFno } from "@/lib/database/fnos";
import { createInstallationSteps } from "@/lib/database/installation-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { FnoInsert, InstallationStepInsert } from "@/lib/database/types";

interface FnoCreateFormProps {
  userId: string;
}

interface InstallationStep {
  step_number: number;
  title: string;
  description: string;
}

export function FnoCreateForm({ userId }: FnoCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FNO form data
  const [fnoData, setFnoData] = useState<Omit<FnoInsert, "created_by">>({
    name: "",
    contact_person: "",
    support_number: "",
    coverage_area: "",
    sla_hours: undefined,
    status: "active",
  });

  // Installation steps data
  const [installationSteps, setInstallationSteps] = useState<InstallationStep[]>([
    { step_number: 1, title: "", description: "" },
    { step_number: 2, title: "", description: "" },
    { step_number: 3, title: "", description: "" },
  ]);

  const handleFnoDataChange = (field: keyof typeof fnoData, value: string | number | undefined) => {
    setFnoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (index: number, field: keyof InstallationStep, value: string | number) => {
    setInstallationSteps(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    );
  };

  const addStep = () => {
    const nextStepNumber = Math.max(...installationSteps.map(s => s.step_number)) + 1;
    setInstallationSteps(prev => [
      ...prev,
      { step_number: nextStepNumber, title: "", description: "" }
    ]);
  };

  const removeStep = (index: number) => {
    if (installationSteps.length <= 3) {
      setError("Minimum 3 installation steps required");
      return;
    }
    setInstallationSteps(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!fnoData.name.trim()) {
      setError("FNO name is required");
      return false;
    }

    if (installationSteps.length < 3) {
      setError("Minimum 3 installation steps required");
      return false;
    }

    for (const step of installationSteps) {
      if (!step.title.trim() || !step.description.trim()) {
        setError("All installation steps must have a title and description");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FNO
      const fnoResult = await createFno({
        ...fnoData,
        created_by: userId,
        sla_hours: fnoData.sla_hours || null,
      });

      if (fnoResult.error || !fnoResult.data) {
        throw new Error(fnoResult.error?.message || "Failed to create FNO");
      }

      // Create installation steps
      const stepsToCreate: InstallationStepInsert[] = installationSteps.map(step => ({
        fno_id: fnoResult.data!.id,
        step_number: step.step_number,
        title: step.title.trim(),
        description: step.description.trim(),
      }));

      const stepsResult = await createInstallationSteps(stepsToCreate);
      if (stepsResult.error) {
        throw new Error(stepsResult.error.message || "Failed to create installation steps");
      }

      // Redirect to FNO details page
      router.push(`/dashboard/manager/fno/${fnoResult.data!.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/manager">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* FNO Details */}
      <Card>
        <CardHeader>
          <CardTitle>FNO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">FNO Name *</Label>
              <Input
                id="name"
                value={fnoData.name}
                onChange={(e) => handleFnoDataChange("name", e.target.value)}
                placeholder="e.g., Vumatel, Frogfoot, Openserve"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={fnoData.contact_person || ""}
                onChange={(e) => handleFnoDataChange("contact_person", e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="support_number">Support Number</Label>
              <Input
                id="support_number"
                value={fnoData.support_number || ""}
                onChange={(e) => handleFnoDataChange("support_number", e.target.value)}
                placeholder="e.g., 087 XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla_hours">SLA Hours</Label>
              <Input
                id="sla_hours"
                type="number"
                min="1"
                value={fnoData.sla_hours || ""}
                onChange={(e) => handleFnoDataChange("sla_hours", parseInt(e.target.value) || undefined)}
                placeholder="e.g., 48"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverage_area">Coverage Area</Label>
            <Input
              id="coverage_area"
              value={fnoData.coverage_area || ""}
              onChange={(e) => handleFnoDataChange("coverage_area", e.target.value)}
              placeholder="e.g., Johannesburg, Pretoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={fnoData.status}
              onChange={(e) => handleFnoDataChange("status", e.target.value as "active" | "inactive")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Installation Steps</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {installationSteps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Step {step.step_number}</h4>
                {installationSteps.length > 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`step-title-${index}`}>Title *</Label>
                <Input
                  id={`step-title-${index}`}
                  value={step.title}
                  onChange={(e) => handleStepChange(index, "title", e.target.value)}
                  placeholder="e.g., Pre-check"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`step-description-${index}`}>Description *</Label>
                <textarea
                  id={`step-description-${index}`}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={step.description}
                  onChange={(e) => handleStepChange(index, "description", e.target.value)}
                  placeholder="e.g., Verify customer details on Vumatel portal"
                  required
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Creating FNO..." : "Create FNO"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/manager">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}