/* data.js
   Simple localStorage-backed catalog for movies and shows
   Model:
   { movies: [{id,title,poster,src}], shows: [{id,title,poster,episodes:[{id,title,episode,src,poster}]}] }
*/
(function(){
    const KEY = 'diib_catalog_v1';
    const uid = ()=> 'id_' + Math.random().toString(36).slice(2,9);

    // Embedded initial catalog used as a fallback when localStorage is empty.
    // عدّل هذا الكائن لإضافة أفلام ومسلسلات افتراضية تظهر للمستخدمين الجدد.
    // البنية المتوقعة:
    // {
    //   movies: [{id,title,poster,src}, ...],
    //   shows: [{id,title,poster,episodes:[{id,title,episode,src,poster}, ...]}, ...]
    // }
    const INITIAL_CATALOG = {
        movies: [
            { id: 'demo_movie_1', title: 'فيلم المهمة الأخيرة كاملاً', poster: '', src: 'https://archive.org/download/hhtlm/hhtlm.mp4' }
        ],
        shows: [
            {
                id: 'demo_show_1',
                title: 'أكاديمية بطلي',
                poster: '',
                episodes: [
                    { id: 'demo_show_1_ep1', title: 'الحلقة الأولى', episode: 1, src: 'https://k.top4top.io/m_3559oca3r1.mp4', poster: '' },
                    { id: 'demo_show_1_ep2', title: 'الحلقة الثانية', episode: 2, src: 'https://l.top4top.io/m_3559msle52.mp4', poster: '' },
                    { id: 'demo_show_1_ep3', title: 'الحلقة الثالثة', episode: 3, src: 'https://a.top4top.io/m_3559whcm63.mp4', poster: '' }

                ]
            }
        ]
    };

    // Load catalog from localStorage. If not present, return the embedded INITIAL_CATALOG.
    // This lets the site show demo content out-of-the-box; admins can later overwrite via the UI.
    function load(){
        try{
            const raw = localStorage.getItem(KEY);
            if(!raw) {
                return JSON.parse(JSON.stringify(INITIAL_CATALOG));
            }
            return JSON.parse(raw);
        }catch(e){
            console.warn('load catalog failed',e);
            return JSON.parse(JSON.stringify(INITIAL_CATALOG));
        }
    }
    function save(cat){
        try{ localStorage.setItem(KEY, JSON.stringify(cat)); window.dispatchEvent(new Event('storage')); }
        catch(e){console.error('save failed',e);}    }

    function getCatalog(){ return load(); }
    function addMovie({title,poster,src}){
        const c = load(); c.movies = c.movies || []; const item = {id:uid(),title:title||'بدون عنوان',poster:poster||'',src:src||''}; c.movies.unshift(item); save(c); return item;
    }
    function addShow({title,poster}){
        const c = load(); c.shows = c.shows || []; const item={id:uid(),title:title||'بدون عنوان',poster:poster||'',episodes:[]}; c.shows.unshift(item); save(c); return item;
    }
    function addEpisode(showId, {title,episode,src,poster}){
        const c = load(); c.shows = c.shows || []; const s = c.shows.find(x=>x.id===showId); if(!s) throw new Error('show not found'); const ep={id:uid(),title:title||('حلقة '+(episode||'')),episode:episode||0,src:src||'',poster:poster||''}; s.episodes.unshift(ep); save(c); return ep;
    }
    function deleteItem(type,id){ const c = load(); if(type==='movie'){ c.movies = (c.movies||[]).filter(m=>m.id!==id); } else if(type==='show'){ c.shows = (c.shows||[]).filter(s=>s.id!==id); } save(c); }
    function updateMovie(id, fields){ const c = load(); c.movies = c.movies || []; const m = c.movies.find(x=>x.id===id); if(!m) throw new Error('movie not found'); Object.assign(m, fields); save(c); return m; }
    function updateShow(id, fields){ const c = load(); c.shows = c.shows || []; const s = c.shows.find(x=>x.id===id); if(!s) throw new Error('show not found'); Object.assign(s, fields); save(c); return s; }
    function updateEpisode(showId, episodeId, fields){ const c = load(); const s = (c.shows||[]).find(x=>x.id===showId); if(!s) throw new Error('show not found'); const ep = (s.episodes||[]).find(e=>e.id===episodeId); if(!ep) throw new Error('episode not found'); Object.assign(ep, fields); save(c); return ep; }
    function deleteEpisode(showId, episodeId){ const c = load(); const s = (c.shows||[]).find(x=>x.id===showId); if(!s) throw new Error('show not found'); s.episodes = (s.episodes||[]).filter(e=>e.id!==episodeId); save(c); }

    // Public API: DIIB
    // - getCatalog(): returns current catalog object
    // - addMovie({title,poster,src}): adds a movie and returns it
    // - addShow({title,poster}): adds a show and returns it
    // - addEpisode(showId, {title,episode,src,poster}): adds episode to a show
    // - deleteItem(type,id): remove movie or show
    // - updateMovie/updateShow/updateEpisode: update items by id
    // - deleteEpisode(showId, episodeId): remove an episode
    window.DIIB = { getCatalog, addMovie, addShow, addEpisode, deleteItem, updateMovie, updateShow, updateEpisode, deleteEpisode };

    // Helper: seed the embedded INITIAL_CATALOG into localStorage (useful for admins)
    // Returns true if seeding occurred, false if localStorage already had data.
    window.DIIB.seedInitial = function(){
        if(!localStorage.getItem(KEY)){
            localStorage.setItem(KEY, JSON.stringify(INITIAL_CATALOG));
            window.dispatchEvent(new Event('storage'));
            return true;
        }
        return false;
    };

})();
