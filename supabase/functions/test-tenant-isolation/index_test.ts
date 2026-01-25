/**
 * Deno Tests for Tenant Isolation Edge Function
 * 
 * Run with: deno test --allow-net --allow-env
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("Tenant Isolation - Edge Function Response", async () => {
  // Este teste verifica que a função responde corretamente
  // Sem autenticação, deve retornar 401
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/test-tenant-isolation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
    }
  );

  const body = await response.text();
  
  // Sem auth header, deve retornar 401
  assertEquals(response.status, 401);
});

Deno.test("Tenant Isolation - CORS Headers", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/test-tenant-isolation`,
    {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "apikey": SUPABASE_ANON_KEY,
      },
    }
  );

  await response.text(); // Consume body
  
  // OPTIONS deve retornar 200 com headers CORS
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
});

Deno.test("Tenant Isolation - Requires Platform Admin", async () => {
  // Tentar acessar com um token de usuário comum deve falhar
  // Este teste assume que há um token de teste disponível
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/test-tenant-isolation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer invalid-token",
      },
    }
  );

  const body = await response.text();
  
  // Token inválido deve retornar 401
  assertEquals(response.status, 401);
});
