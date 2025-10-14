"use client";

import { useState } from "react";
import Link from "next/link";
import { FnoWithSteps, UserRole } from "@/lib/database/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  MapPin, 
  Clock, 
  User,
  Trash2,
  Plus
} from "lucide-react";

interface FnoDetailsProps {
  fno: FnoWithSteps;
  userRole: UserRole;
}

export function FnoDetails({ fno, userRole }: FnoDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this FNO? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implement delete functionality
      console.log("Delete FNO:", fno.id);
    } catch (error) {
      console.error("Failed to delete FNO:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const backUrl = userRole === "manager" ? "/dashboard/manager" : "/dashboard/agent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {userRole === "manager" ? "Dashboard" : "FNO Directory"}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fno.name}</h1>
            <Badge 
              variant={fno.status === "active" ? "default" : "secondary"}
              className="mt-1"
            >
              {fno.status}
            </Badge>
          </div>
        </div>
        
        {userRole === "manager" && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/dashboard/manager/fno/${fno.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit FNO
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {/* FNO Information */}
      <Card>
        <CardHeader>
          <CardTitle>FNO Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fno.contact_person && (
              <div className="flex items-center text-sm">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Contact Person</div>
                  <div className="text-muted-foreground">{fno.contact_person}</div>
                </div>
              </div>
            )}
            
            {fno.support_number && (
              <div className="flex items-center text-sm">
                <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Support Number</div>
                  <div className="text-muted-foreground">{fno.support_number}</div>
                </div>
              </div>
            )}
            
            {fno.coverage_area && (
              <div className="flex items-center text-sm">
                <MapPin className="mr-3 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Coverage Area</div>
                  <div className="text-muted-foreground">{fno.coverage_area}</div>
                </div>
              </div>
            )}
            
            {fno.sla_hours && (
              <div className="flex items-center text-sm">
                <Clock className="mr-3 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">SLA</div>
                  <div className="text-muted-foreground">{fno.sla_hours} hours</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Installation Process</CardTitle>
            {userRole === "manager" && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/manager/fno/${fno.id}/steps`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Steps
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fno.installation_steps.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No installation steps</h3>
              <p className="text-muted-foreground mb-4">
                This FNO doesn&apos;t have any installation steps defined yet.
              </p>
              {userRole === "manager" && (
                <Button asChild>
                  <Link href={`/dashboard/manager/fno/${fno.id}/steps`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Installation Steps
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {fno.installation_steps
                .sort((a, b) => a.step_number - b.step_number)
                .map((step) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step_number}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Created: {new Date(fno.created_at).toLocaleDateString()}</div>
          <div>Last Updated: {new Date(fno.updated_at).toLocaleDateString()}</div>
          <div>Total Steps: {fno.installation_steps.length}</div>
        </CardContent>
      </Card>
    </div>
  );
}