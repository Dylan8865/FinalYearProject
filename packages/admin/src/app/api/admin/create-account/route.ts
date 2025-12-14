import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin privileges
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.type !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { name, email, password, type } = await request.json();

    if (!name || !email || !password || !type) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create user with admin API (auto-confirms email)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      
      // Use UPSERT to handle auto-created profiles from triggers
      // This will INSERT if not exists, or UPDATE if exists
      const { data: profileData, error: profileError } = await adminClient
        .from("profile")
        .upsert({
          id: authData.user.id,
          name: name,
          email: email,
          last_login_time: null,
          mana: 0,
          level: type === "island" ? 1 : 0,
          type: type,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {
          // Silent cleanup failure
        });
        return NextResponse.json(
          { error: "Failed to create profile: " + profileError.message },
          { status: 500 }
        );
      }

      // Create default island for island users
      if (type === "island") {
        const { data: islandData, error: islandError } = await adminClient
          .from("island")
          .insert({
            name: '"Hello World" Island',
            level: 1,
            theme: "summer",
            profile_id: authData.user.id,
          })
          .select()
          .single();

        if (islandError) {
          // Don't fail the entire operation if island creation fails
        }
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          name,
          email,
          type,
        },
      });
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
