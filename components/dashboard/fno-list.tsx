"use client";

import { useState } from "react";
import Link from "next/link";
import { FnoRow, UserRole } from "@/lib/database/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Edit, 
  Eye, 
  Trash2, 
  Phone, 
  MapPin, 
  Clock, 
  User,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FnoListProps {
  fnos: FnoRow[];
  userRole: UserRole;
}

export function FnoList({ fnos, userRole }: FnoListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FNO? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      // TODO: Implement delete functionality
      console.log("Delete FNO:", id);
    } catch (error) {
      console.error("Failed to delete FNO:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (fnos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No FNOs found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {fnos.map((fno) => (
        <Card key={fno.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{fno.name}</CardTitle>
                <Badge 
                  variant={fno.status === "active" ? "default" : "secondary"}
                  className="w-fit"
                >
                  {fno.status}
                </Badge>
              </div>
              {userRole === "manager" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/manager/fno/${fno.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/manager/fno/${fno.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(fno.id)}
                      disabled={deletingId === fno.id}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === fno.id ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fno.contact_person && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-2 h-4 w-4" />
                {fno.contact_person}
              </div>
            )}
            {fno.support_number && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                {fno.support_number}
              </div>
            )}
            {fno.coverage_area && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                {fno.coverage_area}
              </div>
            )}
            {fno.sla_hours && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {fno.sla_hours} hour SLA
              </div>
            )}
            
            <div className="pt-2">
              {userRole === "manager" ? (
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/manager/fno/${fno.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/manager/fno/${fno.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/dashboard/agent/fno/${fno.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}