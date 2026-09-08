const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  'ec-gris':  'price_1TmKWARy4bA40rpvQPFvhafD',   // Eclipse Gris
  'ec-aqua':  'price_1TmKYoRy4bA40rpvRdPA163E',   // Eclipse Aqua
  'ec-azul':  'price_1TmKaVRy4bA40rpv0wBVpn7k',   // Eclipse Azul
  'en-blanco':'price_1TmKkFRy4bA40rpvu9HAxGl0',   // Corazones Blancos
  'en-azul':  'price_1TmKmLRy4bA40rpvpB322chI',   // Corazones Azules
  'en-rojo':  'price_1TmKlURy4bA40rpvzcMibMjL',   // Corazones Rojos
  'en-perla': 'price_1TmKnJRy4bA40rpvWUpcpXlI',   // Perla Entrelazada
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { items } = JSON.parse(event.body || '{}');
    if (!items || !items.length)
      return { statusCode: 400, body: JSON.stringify({ error: 'Carrito vacio' }) };

    const line_items = items
      .filter(i => PRICES[i.id])
      .map(i => ({ price: PRICES[i.id], quantity: Math.max(1, parseInt(i.qty) || 1) }));

    if (!line_items.length)
      return { statusCode: 400, body: JSON.stringify({ error: 'Sin productos validos' }) };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 1000, currency: 'usd' },
          display_name: 'Envio ($10)',
        },
      }],
      phone_number_collection: { enabled: true },
      success_url: `${process.env.URL}/?pago=exito`,
      cancel_url: `${process.env.URL}/?pago=cancelado`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
