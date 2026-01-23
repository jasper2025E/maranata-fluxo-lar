import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find subscriptions expiring in the next 7 days (trial or with subscription_ends_at)
    const { data: expiringTrials, error: trialsError } = await supabase
      .from("tenants")
      .select("id, nome, email, trial_ends_at, subscription_status")
      .eq("subscription_status", "trial")
      .gte("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", sevenDaysFromNow.toISOString());

    if (trialsError) {
      console.error("Error fetching expiring trials:", trialsError);
    }

    const { data: expiringSubscriptions, error: subsError } = await supabase
      .from("tenants")
      .select("id, nome, email, subscription_ends_at, subscription_status")
      .in("subscription_status", ["active", "past_due"])
      .not("subscription_ends_at", "is", null)
      .gte("subscription_ends_at", now.toISOString())
      .lte("subscription_ends_at", sevenDaysFromNow.toISOString());

    if (subsError) {
      console.error("Error fetching expiring subscriptions:", subsError);
    }

    // Find past_due subscriptions in grace period that are about to be suspended
    const { data: pastDueNearingSuspension, error: pastDueError } = await supabase
      .from("tenants")
      .select("id, nome, email, grace_period_ends_at, subscription_status, monthly_price")
      .eq("subscription_status", "past_due")
      .not("grace_period_ends_at", "is", null)
      .gte("grace_period_ends_at", now.toISOString())
      .lte("grace_period_ends_at", threeDaysFromNow.toISOString());

    if (pastDueError) {
      console.error("Error fetching past due subscriptions:", pastDueError);
    }

    const notifications: Array<{ tenant_id: string; type: string; metadata: Record<string, unknown> }> = [];

    // Process expiring trials
    if (expiringTrials && expiringTrials.length > 0) {
      for (const tenant of expiringTrials) {
        const daysLeft = Math.ceil(
          (new Date(tenant.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Only send notification once per day (check if we already sent today)
        const today = now.toISOString().split("T")[0];
        const { data: existingNotification } = await supabase
          .from("subscription_history")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("event_type", "notification_subscription_expiring")
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          notifications.push({
            tenant_id: tenant.id,
            type: "subscription_expiring",
            metadata: { days_left: daysLeft, is_trial: true },
          });
        }
      }
    }

    // Process expiring subscriptions
    if (expiringSubscriptions && expiringSubscriptions.length > 0) {
      for (const tenant of expiringSubscriptions) {
        const daysLeft = Math.ceil(
          (new Date(tenant.subscription_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const today = now.toISOString().split("T")[0];
        const { data: existingNotification } = await supabase
          .from("subscription_history")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("event_type", "notification_subscription_expiring")
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          notifications.push({
            tenant_id: tenant.id,
            type: "subscription_expiring",
            metadata: { days_left: daysLeft, is_trial: false },
          });
        }
      }
    }

    // Process past due nearing suspension
    if (pastDueNearingSuspension && pastDueNearingSuspension.length > 0) {
      for (const tenant of pastDueNearingSuspension) {
        const daysLeft = Math.ceil(
          (new Date(tenant.grace_period_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const today = now.toISOString().split("T")[0];
        const { data: existingNotification } = await supabase
          .from("subscription_history")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("event_type", "notification_payment_reminder")
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          notifications.push({
            tenant_id: tenant.id,
            type: "payment_reminder",
            metadata: { 
              days_until_suspension: daysLeft, 
              amount: tenant.monthly_price,
            },
          });
        }
      }
    }

    // Send notifications via the notification function
    const notificationResults = await Promise.allSettled(
      notifications.map((notification) =>
        fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(notification),
        })
      )
    );

    const successCount = notificationResults.filter((r) => r.status === "fulfilled").length;
    const failCount = notificationResults.filter((r) => r.status === "rejected").length;

    console.log(`Processed ${notifications.length} notifications: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        expiring_trials: expiringTrials?.length || 0,
        expiring_subscriptions: expiringSubscriptions?.length || 0,
        past_due_reminders: pastDueNearingSuspension?.length || 0,
        notifications_sent: successCount,
        notifications_failed: failCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in check-expiring-subscriptions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
