export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  /* global Deno */
  const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
  const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

  const origin = req.headers.get("Origin") || "https://warrior-clans.base44.app";
  const thankYouUrl = `${origin}/payment-success`;
  const postFlowUrl = `${origin}/shop`;

  const body = await req.json();
  const { userId, profileId } = body;

  const response = await fetch(
    "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
      },
      body: JSON.stringify({
        cart: {
          items: [
            {
              name: "500 Moonstones",
              quantity: 1,
              price: "4.99",
            },
          ],
        },
        callbackUrls: {
          thankYouPageUrl: `${thankYouUrl}?userId=${userId}&profileId=${profileId}`,
          postFlowUrl,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Wix Payments error:", JSON.stringify(data));
    return new Response(JSON.stringify({ error: data.message || "Payment error" }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ redirectUrl: data.checkoutSession.redirectUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
