"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFno } from "@/lib/database/fnos";
import { updateInstallationStep, createInstallationStep, deleteInstallationStep } from "@/lib/database/installation-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { FnoWithSteps, FnoUpdate, InstallationStepInsert, InstallationStepUpdate } from "@/lib/database/types";

interface FnoEditFormProps {
  fno: FnoWithSteps;
}

interface InstallationStep {
  id?: string;
  step_number: number;
  title: string;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export function FnoEditForm({ fno }: FnoEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FNO form data
  const [fnoData, setFnoData] = useState<FnoUpdate>({
    name: fno.name,
    contact_person: fno.contact_person,
    support_number: fno.support_number,
    coverage_area: fno.coverage_area,
    sla_hours: fno.sla_hours,
    status: fno.status,
  });

  // Installation steps data
  const [installationSteps, setInstallationSteps] = useState<InstallationStep[]>(
    fno.installation_steps
      .sort((a, b) => a.step_number - b.step_number)
      .map(step => ({
        id: step.id,
        step_number: step.step_number,
        title: step.title,
        description: step.description,
        isNew: false,
        isDeleted: false,
      }))
  );

  const handleFnoDataChange = (field: keyof FnoUpdate, value: string | number | undefined | null) => {
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
    const activeSteps = installationSteps.filter(s => !s.isDeleted);
    const nextStepNumber = activeSteps.length > 0 
      ? Math.max(...activeSteps.map(s => s.step_number)) + 1 
      : 1;
    
    setInstallationSteps(prev => [
      ...prev,
      { 
        step_number: nextStepNumber, 
        title: "", 
        description: "", 
        isNew: true,
        isDeleted: false
      }
    ]);
  };

  const markStepForDeletion = (index: number) => {
    const activeSteps = installationSteps.filter(s => !s.isDeleted);
    if (activeSteps.length <= 3) {
      setError("Minimum 3 installation steps required");
      return;
    }
    
    setInstallationSteps(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, isDeleted: true } : step
      )
    );
  };

  const restoreStep = (index: number) => {
    setInstallationSteps(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, isDeleted: false } : step
      )
    );
  };

  const validateForm = (): boolean => {
    if (!fnoData.name?.trim()) {
      setError("FNO name is required");
      return false;
    }

    const activeSteps = installationSteps.filter(s => !s.isDeleted);
    if (activeSteps.length < 3) {
      setError("Minimum 3 installation steps required");
      return false;
    }

    for (const step of activeSteps) {
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
      // Update FNO
      const fnoResult = await updateFno(fno.id, {
        ...fnoData,
        updated_at: new Date().toISOString(),
      });

      if (fnoResult.error) {
        throw new Error(fnoResult.error.message || "Failed to update FNO");
      }

      // Handle installation steps
      const activeSteps = installationSteps.filter(s => !s.isDeleted);
      
      // Delete marked steps
      const stepsToDelete = installationSteps.filter(s => s.isDeleted && s.id);
      for (const step of stepsToDelete) {
        if (step.id) {
          const deleteResult = await deleteInstallationStep(step.id);
          if (deleteResult.error) {
            console.error("Failed to delete step:", deleteResult.error);
          }
        }
      }

      // Create new steps
      const newSteps = activeSteps.filter(s => s.isNew);
      for (const step of newSteps) {
        const createData: InstallationStepInsert = {
          fno_id: fno.id,
          step_number: step.step_number,
          title: step.title.trim(),
          description: step.description.trim(),
        };
        
        const createResult = await createInstallationStep(createData);
        if (createResult.error) {
          throw new Error(createResult.error.message || "Failed to create installation step");
        }
      }

      // Update existing steps
      const existingSteps = activeSteps.filter(s => !s.isNew && s.id);
      for (const step of existingSteps) {
        if (step.id) {
          const updateData: InstallationStepUpdate = {
            step_number: step.step_number,
            title: step.title.trim(),
            description: step.description.trim(),
          };
          
          const updateResult = await updateInstallationStep(step.id, updateData);
          if (updateResult.error) {
            console.error("Failed to update step:", updateResult.error);
          }
        }
      }

      // Redirect to FNO details page
      router.push(`/dashboard/manager/fno/${fno.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSteps = installationSteps.filter(s => !s.isDeleted);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/manager/fno/${fno.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to FNO Details
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
                value={fnoData.name || ""}
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
            <CardTitle>Installation Steps ({activeSteps.length})</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {installationSteps.map((step, index) => (
            <div 
              key={step.id || index} 
              className={`border rounded-lg p-4 space-y-3 ${
                step.isDeleted ? 'opacity-50 bg-muted' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Step {step.step_number}
                  {step.isNew && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">New</span>}
                  {step.isDeleted && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Deleted</span>}
                </h4>
                <div className="flex gap-2">
                  {step.isDeleted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreStep(index)}
                      className="text-green-600 hover:text-green-700"
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => markStepForDeletion(index)}
                      className="text-destructive hover:text-destructive"
                      disabled={activeSteps.length <= 3}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {!step.isDeleted && (
                <>
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
                </>
              )}
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
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving Changes..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/manager/fno/${fno.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}