import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPESECRETAPI");
    if (!stripeSecretKey) {
      throw new Error("Stripe não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT and check platform admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Check if user is platform admin using the database function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc("is_platform_admin", { _user_id: user.id });

    if (roleError || !isAdmin) {
      throw new Error("Acesso negado: apenas administradores da plataforma");
    }

    const { tenantId, action } = await req.json();

    if (!tenantId) {
      throw new Error("ID do tenant é obrigatório");
    }

    // Fetch tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error("Tenant não encontrado");
    }

    console.log(`Sincronizando tenant ${tenantId} com Stripe. Ação: ${action || 'sync'}`);

    // Fetch plan from database
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", tenant.plano)
      .eq("active", true)
      .single();

    let result: any = { success: true, actions: [] };

    // Check if tenant has Stripe subscription
    if (!tenant.stripe_subscription_id) {
      result.actions.push({ type: "info", message: "Tenant não possui assinatura Stripe ativa" });
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current Stripe subscription
    const subscriptionResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
      {
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
        },
      }
    );

    const stripeSubscription = await subscriptionResponse.json();

    if (stripeSubscription.error) {
      if (stripeSubscription.error.code === "resource_missing") {
        // Subscription doesn't exist in Stripe, clear local reference
        await supabase
          .from("tenants")
          .update({ stripe_subscription_id: null })
          .eq("id", tenantId);
        
        result.actions.push({ 
          type: "warning", 
          message: "Assinatura não encontrada no Stripe. Referência local removida." 
        });
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(stripeSubscription.error.message);
    }

    // Handle cancellation
    if (action === "cancel" || tenant.subscription_status === "canceled") {
      if (stripeSubscription.status !== "canceled") {
        console.log("Cancelando assinatura no Stripe...");
        
        const cancelResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${stripeSecretKey}`,
            },
          }
        );

        const cancelResult = await cancelResponse.json();
        
        if (cancelResult.error) {
          throw new Error(cancelResult.error.message);
        }

        result.actions.push({ type: "success", message: "Assinatura cancelada no Stripe" });
      } else {
        result.actions.push({ type: "info", message: "Assinatura já estava cancelada no Stripe" });
      }
    }

    // Handle plan change
    if (plan && action === "update_plan") {
      const currentPriceId = stripeSubscription.items?.data?.[0]?.price?.id;
      
      // Find or create the correct price in Stripe
      const productSearch = await fetch(
        `https://api.stripe.com/v1/products/search?query=metadata['plan_id']:'${tenant.plano}'`,
        {
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
          },
        }
      );
      
      const productSearchResult = await productSearch.json();
      let productId: string | null = null;

      if (productSearchResult.data && productSearchResult.data.length > 0) {
        productId = productSearchResult.data[0].id;
      }

      if (productId) {
        // Find price for this product with matching amount
        const priceSearch = await fetch(
          `https://api.stripe.com/v1/prices?product=${productId}&active=true&type=recurring`,
          {
            headers: {
              "Authorization": `Bearer ${stripeSecretKey}`,
            },
          }
        );

        const priceSearchResult = await priceSearch.json();
        const targetPrice = priceSearchResult.data?.find(
          (p: any) => p.unit_amount === plan.price && p.currency === "brl"
        );

        if (targetPrice && targetPrice.id !== currentPriceId) {
          // Update subscription with new price
          const subscriptionItemId = stripeSubscription.items?.data?.[0]?.id;
          
          if (subscriptionItemId) {
            const updateResponse = await fetch(
              `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${stripeSecretKey}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  [`items[0][id]`]: subscriptionItemId,
                  [`items[0][price]`]: targetPrice.id,
                  "proration_behavior": "create_prorations",
                }),
              }
            );

            const updateResult = await updateResponse.json();
            
            if (updateResult.error) {
              throw new Error(updateResult.error.message);
            }

            result.actions.push({ 
              type: "success", 
              message: `Plano atualizado para ${plan.name} no Stripe` 
            });
          }
        } else if (!targetPrice) {
          result.actions.push({ 
            type: "warning", 
            message: "Preço do plano não encontrado no Stripe. Crie o preço manualmente." 
          });
        } else {
          result.actions.push({ 
            type: "info", 
            message: "Plano já está sincronizado com o Stripe" 
          });
        }
      } else {
        result.actions.push({ 
          type: "warning", 
          message: "Produto do plano não encontrado no Stripe" 
        });
      }
    }

    // Handle pause/resume
    if (action === "pause" && stripeSubscription.status === "active") {
      const pauseResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "pause_collection[behavior]": "mark_uncollectible",
          }),
        }
      );

      const pauseResult = await pauseResponse.json();
      
      if (pauseResult.error) {
        throw new Error(pauseResult.error.message);
      }

      result.actions.push({ type: "success", message: "Cobrança pausada no Stripe" });
    }

    if (action === "resume" && stripeSubscription.pause_collection) {
      const resumeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "pause_collection": "",
          }),
        }
      );

      const resumeResult = await resumeResponse.json();
      
      if (resumeResult.error) {
        throw new Error(resumeResult.error.message);
      }

      result.actions.push({ type: "success", message: "Cobrança retomada no Stripe" });
    }

    // Sync billing configuration TO Stripe (push local data to Stripe)
    if (action !== "cancel") {
      // If local billing_day is set, update Stripe subscription billing cycle
      if (tenant.billing_day && tenant.next_billing_date) {
        console.log(`Atualizando ciclo de cobrança no Stripe para dia ${tenant.billing_day}...`);
        
        // Calculate the next billing anchor based on local billing_day
        const today = new Date();
        let nextAnchor = new Date(today.getFullYear(), today.getMonth(), tenant.billing_day);
        
        // If the billing day has passed this month, move to next month
        if (nextAnchor <= today) {
          nextAnchor.setMonth(nextAnchor.getMonth() + 1);
        }
        
        const anchorTimestamp = Math.floor(nextAnchor.getTime() / 1000);
        
        // Update subscription with new billing cycle anchor
        const updateBillingResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${stripeSecretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              "billing_cycle_anchor": String(anchorTimestamp),
              "proration_behavior": "none", // Don't charge prorated amounts
            }),
          }
        );

        const updateBillingResult = await updateBillingResponse.json();
        
        if (updateBillingResult.error) {
          // If billing_cycle_anchor update fails (common for active subscriptions),
          // try updating the subscription schedule instead
          console.log("Não foi possível atualizar anchor diretamente, tentando trial_end...");
          
          // Alternative: Use trial_end to shift the billing date
          const trialEndResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${stripeSecretKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                "trial_end": String(anchorTimestamp),
                "proration_behavior": "none",
              }),
            }
          );
          
          const trialEndResult = await trialEndResponse.json();
          
          if (trialEndResult.error) {
            result.actions.push({ 
              type: "warning", 
              message: `Não foi possível alterar data de cobrança: ${trialEndResult.error.message}. Considere cancelar e recriar a subscription.` 
            });
          } else {
            result.actions.push({ 
              type: "success", 
              message: `Próxima cobrança ajustada para ${nextAnchor.toISOString().split("T")[0]}` 
            });
          }
        } else {
          result.actions.push({ 
            type: "success", 
            message: `Ciclo de cobrança atualizado no Stripe para dia ${tenant.billing_day}` 
          });
        }
      }

      // Fetch updated subscription status from Stripe
      const updatedSubResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${tenant.stripe_subscription_id}`,
        {
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
          },
        }
      );

      const updatedSub = await updatedSubResponse.json();
      
      if (!updatedSub.error) {
        // Map Stripe status to our status
        let mappedStatus = tenant.subscription_status;
        if (updatedSub.status === "active") mappedStatus = "active";
        else if (updatedSub.status === "past_due") mappedStatus = "past_due";
        else if (updatedSub.status === "canceled") mappedStatus = "canceled";
        else if (updatedSub.status === "trialing") mappedStatus = "trialing";

        // Get next billing date FROM Stripe (after our updates)
        const stripeNextBillingDate = updatedSub.current_period_end 
          ? new Date(updatedSub.current_period_end * 1000)
          : null;

        // Get current price from Stripe
        const monthlyPrice = updatedSub.items?.data?.[0]?.price?.unit_amount
          ? updatedSub.items.data[0].price.unit_amount / 100
          : tenant.monthly_price;

        // Update local DB with Stripe's confirmed dates
        await supabase
          .from("tenants")
          .update({
            subscription_status: mappedStatus,
            next_billing_date: stripeNextBillingDate ? stripeNextBillingDate.toISOString().split("T")[0] : tenant.next_billing_date,
            billing_day: stripeNextBillingDate ? stripeNextBillingDate.getDate() : tenant.billing_day,
            monthly_price: monthlyPrice,
            auto_billing_enabled: updatedSub.status === "active" || updatedSub.status === "trialing",
          })
          .eq("id", tenantId);

        result.stripeStatus = updatedSub.status;
        result.nextBillingDate = stripeNextBillingDate ? stripeNextBillingDate.toISOString().split("T")[0] : null;
        result.billingDay = stripeNextBillingDate ? stripeNextBillingDate.getDate() : tenant.billing_day;
        result.monthlyPrice = monthlyPrice;
        
        result.actions.push({ 
          type: "info", 
          message: `Status Stripe: ${updatedSub.status}, Próxima cobrança: ${result.nextBillingDate || 'N/A'}` 
        });
      }
    }

    // Log the sync action
    await supabase.from("subscription_history").insert({
      tenant_id: tenantId,
      event_type: `stripe_sync_${action || 'check'}`,
      old_status: tenant.subscription_status,
      new_status: tenant.subscription_status,
      metadata: {
        actions: result.actions,
        performed_by: user.id,
      },
    });

    console.log("Sincronização concluída:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no sync-tenant-subscription:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
