import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      trialsExpired: 0,
      gracePeriodExpired: 0,
      notificationsSent: 0,
      errors: [] as string[],
    };

    console.log(`Processing expired subscriptions at ${now.toISOString()}`);

    // 1. Find trials that have expired
    const { data: expiredTrials, error: trialsError } = await supabase
      .from("tenants")
      .select("id, nome, email, trial_ends_at")
      .eq("subscription_status", "trial")
      .lt("trial_ends_at", now.toISOString());

    if (trialsError) {
      console.error("Error fetching expired trials:", trialsError);
      results.errors.push(`Trials fetch error: ${trialsError.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      console.log(`Found ${expiredTrials.length} expired trials`);

      for (const tenant of expiredTrials) {
        try {
          // Update tenant to past_due with 7-day grace period
          const gracePeriodEndsAt = new Date();
          gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7);

          await supabase
            .from("tenants")
            .update({
              subscription_status: "past_due",
              grace_period_ends_at: gracePeriodEndsAt.toISOString(),
            })
            .eq("id", tenant.id);

          // Log the event
          await supabase.from("subscription_history").insert({
            tenant_id: tenant.id,
            event_type: "trial_expired",
            old_status: "trial",
            new_status: "past_due",
            metadata: {
              trial_ends_at: tenant.trial_ends_at,
              grace_period_ends_at: gracePeriodEndsAt.toISOString(),
              message: "Trial expirado - período de carência iniciado",
            },
          });

          results.trialsExpired++;

          // Send notification to tenant admins
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "subscription_expired",
                tenant_id: tenant.id,
                metadata: {
                  tenant_name: tenant.nome,
                  grace_period_ends_at: gracePeriodEndsAt.toISOString(),
                },
              }),
            });
            results.notificationsSent++;
          } catch (notifError) {
            console.error(`Error sending notification to tenant ${tenant.id}:`, notifError);
          }

          console.log(`Trial expired for tenant ${tenant.id} (${tenant.nome})`);
        } catch (error) {
          console.error(`Error processing trial expiration for ${tenant.id}:`, error);
          results.errors.push(`Tenant ${tenant.id}: ${error}`);
        }
      }
    }

    // 2. Find tenants with expired grace period (should be suspended)
    const { data: expiredGracePeriods, error: graceError } = await supabase
      .from("tenants")
      .select("id, nome, email, grace_period_ends_at")
      .eq("subscription_status", "past_due")
      .lt("grace_period_ends_at", now.toISOString())
      .is("blocked_at", null);

    if (graceError) {
      console.error("Error fetching expired grace periods:", graceError);
      results.errors.push(`Grace period fetch error: ${graceError.message}`);
    } else if (expiredGracePeriods && expiredGracePeriods.length > 0) {
      console.log(`Found ${expiredGracePeriods.length} expired grace periods`);

      for (const tenant of expiredGracePeriods) {
        try {
          // Suspend the tenant
          await supabase
            .from("tenants")
            .update({
              subscription_status: "suspended",
              blocked_at: now.toISOString(),
              blocked_reason: "Período de carência expirado - pagamento não regularizado",
            })
            .eq("id", tenant.id);

          // Log the event
          await supabase.from("subscription_history").insert({
            tenant_id: tenant.id,
            event_type: "subscription_suspended",
            old_status: "past_due",
            new_status: "suspended",
            metadata: {
              grace_period_ends_at: tenant.grace_period_ends_at,
              message: "Acesso suspenso por falta de pagamento",
            },
          });

          results.gracePeriodExpired++;

          // Send suspension notification
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "subscription_suspended",
                tenant_id: tenant.id,
                metadata: {
                  tenant_name: tenant.nome,
                },
              }),
            });
            results.notificationsSent++;
          } catch (notifError) {
            console.error(`Error sending suspension notification to tenant ${tenant.id}:`, notifError);
          }

          console.log(`Tenant ${tenant.id} (${tenant.nome}) suspended`);
        } catch (error) {
          console.error(`Error processing suspension for ${tenant.id}:`, error);
          results.errors.push(`Tenant ${tenant.id}: ${error}`);
        }
      }
    }

    // 3. Send reminders for trials expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

    const { data: expiringTrials, error: expiringError } = await supabase
      .from("tenants")
      .select("id, nome, email, trial_ends_at")
      .eq("subscription_status", "trial")
      .gte("trial_ends_at", threeDaysFromNow.toISOString())
      .lt("trial_ends_at", fourDaysFromNow.toISOString());

    if (!expiringError && expiringTrials && expiringTrials.length > 0) {
      console.log(`Found ${expiringTrials.length} trials expiring in 3 days`);

      for (const tenant of expiringTrials) {
        // Check if we already sent a reminder today
        const today = now.toISOString().split("T")[0];
        const { data: existingNotif } = await supabase
          .from("subscription_history")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("event_type", "trial_expiring_reminder")
          .gte("created_at", today)
          .limit(1);

        if (!existingNotif || existingNotif.length === 0) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "subscription_expiring",
                tenant_id: tenant.id,
                metadata: {
                  tenant_name: tenant.nome,
                  trial_ends_at: tenant.trial_ends_at,
                  days_remaining: 3,
                },
              }),
            });

            await supabase.from("subscription_history").insert({
              tenant_id: tenant.id,
              event_type: "trial_expiring_reminder",
              metadata: {
                trial_ends_at: tenant.trial_ends_at,
                days_remaining: 3,
              },
            });

            results.notificationsSent++;
            console.log(`Trial expiring reminder sent to tenant ${tenant.id}`);
          } catch (notifError) {
            console.error(`Error sending expiring reminder to ${tenant.id}:`, notifError);
          }
        }
      }
    }

    console.log("Processing complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        processed_at: now.toISOString(),
        ...results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Process expired subscriptions error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
