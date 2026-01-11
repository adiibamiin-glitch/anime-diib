/* data.js
   Simple localStorage-backed catalog for movies and shows
   Model:
   { movies: [{id,title,poster,src}], shows: [{id,title,poster,episodes:[{id,title,episode,src,poster}]}] }
*/
(function(){
    const KEY = 'diib_catalog_v1';
    const uid = ()=> 'id_' + Math.random().toString(36).slice(2,9);

    // Production-ready defaults: start with empty catalogs
    const defaults = {
        movies: [],
        shows: []
    };

    function load(){
        try{
            const raw = localStorage.getItem(KEY);
            if(!raw) return JSON.parse(JSON.stringify(defaults));
            return JSON.parse(raw);
        }catch(e){console.warn('load catalog failed',e); return JSON.parse(JSON.stringify(defaults));}
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

    window.DIIB = { getCatalog, addMovie, addShow, addEpisode, deleteItem, updateMovie, updateShow, updateEpisode, deleteEpisode };

})();
