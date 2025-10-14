import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user_id, role } = body;

    // Verify the user is creating their own role
    if (user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only create your own role" },
        { status: 403 }
      );
    }

    // Validate role
    if (!role || !['agent', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'agent' or 'manager'" },
        { status: 400 }
      );
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingRole) {
      console.info("[API] Role already exists", { user_id, role: existingRole.role });
      return NextResponse.json({ 
        data: existingRole,
        message: "Role already exists"
      });
    }

    // Create the role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id, role })
      .select()
      .single();

    if (error) {
      console.error("[API] Role creation error", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.info("[API] Role created successfully", { user_id, role });
    return NextResponse.json({ data });

  } catch (error) {
    console.error("[API] Unexpected error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

