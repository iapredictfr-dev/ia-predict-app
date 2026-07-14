// v2 - force rebuild + diagnostic clé API
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const key = process.env.ANTHROPIC_API_KEY || '';
    return res.status(200).json({
      debug: true,
      keyPresente: !!key,
      keyLongueur: key.length,
      keyDebut: key ? key.slice(0, 7) + '...' : '(vide)'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, mode, restaurantContext } = req.body;

  const sysList = {
    coach: `Tu es le Coach Manager IA d'IA Predict. Restaurant: ${restaurantContext?.nom}. L'IA conseille, le manager décide. Sois précis, chiffré, actionnable.`,
    planning: `Tu es le générateur de planning IA d'IA Predict. Génère des plannings optimisés avec calculs de coûts réels.`,
    twin: `Tu analyses les données du Jumeau Numérique d'IA Predict. Donne des insights concis (5-7 lignes max).`,
    scores: `Tu analyses les IA Scores™ pour ${restaurantContext?.nom}. Pour chaque score faible: cause + action + délai.`,
    default: `Tu es l'assistant IA d'IA Predict, expert restauration rapide.`
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY absente côté serveur' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: mode === 'planning' ? 8192 : 1024,
        system: sysList[mode] || sysList.default,
        messages
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Erreur API Claude' });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
