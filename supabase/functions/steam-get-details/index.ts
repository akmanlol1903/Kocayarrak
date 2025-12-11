import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appId } = await req.json();
    if (!appId) throw new Error('Uygulama ID (appId) gereklidir');

    const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=tr&l=turkish`);
    if (!detailsResponse.ok) throw new Error('Steam mağazasından detaylar alınamadı.');
    const detailsData = await detailsResponse.json();

    const gameData = detailsData[appId];

    if (!gameData || gameData.success === false) {
      return new Response(JSON.stringify({ success: false, message: 'Oyun mağazada bulunamadı.' }), { status: 404 });
    }

    const result = {
      success: true,
      about_the_game: gameData.data.about_the_game,
      short_description: gameData.data.short_description,
      screenshots: gameData.data.screenshots?.map((ss: any) => ({
        id: ss.id,
        url: ss.path_full,
      })) || [],
      pc_requirements: gameData.data.pc_requirements,
      header_image: gameData.data.header_image,
      genres: gameData.data.genres,
      developers: gameData.data.developers,
      publishers: gameData.data.publishers,
      release_date: gameData.data.release_date, // EKLENDİ: Çıkış tarihi bilgisi
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});