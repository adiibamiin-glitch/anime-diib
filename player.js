// Custom player controller with controls, HLS support and proxy fallback
(function(){
    function qs(name){ return new URLSearchParams(location.search).get(name); }
    const src = qs('src');
    const title = qs('title') || 'مشاهدة';
    const poster = qs('poster') || '';
    const elTitle = document.getElementById('player-title');
    const video = document.getElementById('video');
    const iframeWrap = document.getElementById('iframe-wrap');
    const msg = document.getElementById('player-message');

    const btnPlay = document.getElementById('btn-play');
    const progress = document.getElementById('progress');
    const timeEl = document.getElementById('time');
    const volume = document.getElementById('volume');
    const speed = document.getElementById('speed');
    const btnFull = document.getElementById('btn-full');

    elTitle.textContent = title;
    if(poster) video.setAttribute('poster', poster);
    if(!src){ msg.textContent = 'لم يتم توفير رابط الفيديو.'; return; }

    const lower = src.toLowerCase();
    const isM3u8 = lower.indexOf('.m3u8') !== -1;
    const isVideoFile = !!lower.match(/\.(mp4|webm|ogg)(\?|$)/);
    const directSrc = src;
    const proxiedSrc = '/proxy?url=' + encodeURIComponent(src);

    function fmt(t){ if(!isFinite(t)) return '00:00'; const s=Math.floor(t%60), m=Math.floor(t/60)%60, h=Math.floor(t/3600); return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
    function setPlayState(){ btnPlay.textContent = video.paused? 'تشغيل' : 'إيقاف'; }

    function attachDirect(){
        if(isM3u8){
            if(window.Hls && Hls.isSupported()){
                const hls = new Hls();
                hls.on(Hls.Events.ERROR, (ev,data)=>{
                    console.warn('HLS error',data);
                    appendMsg('HLS: '+(data.type||'')+' / '+(data.details||''));
                    if(data && data.response){ appendMsg('HLS response: '+(data.response.code||'')+' '+(data.response.url||'')); }
                    if(data && data.fatal){
                        if(!hls.__triedProxy){ hls.__triedProxy = true; appendMsg('محاولة التحويل إلى الخادم الوسيط...'); hls.loadSource(proxiedSrc); return; }
                        msg.textContent='فشل تشغيل البث (HLS).';
                    }
                });
                hls.loadSource(directSrc);
                hls.attachMedia(video);
            } else if(video.canPlayType('application/vnd.apple.mpegurl')){
                video.src = directSrc;
                video.addEventListener('error', ()=>{ if(!video.__triedProxy){ video.__triedProxy=true; video.src=proxiedSrc; } });
            } else {
                iframeWrap.style.display='block'; video.style.display='none'; iframeWrap.innerHTML='<iframe src="'+src+'" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe>'; msg.textContent='يتم تشغيل المصدر داخل إطار (iframe).';
            }
        } else if(isVideoFile){
            try{ video.controlsList='nodownload'; }catch(e){}
            video.src = directSrc;
            video.addEventListener('error', (e)=>{
                console.warn('direct video error',e);
                const ve = video.error;
                if(ve){ appendMsg('VideoError code='+ve.code+' ('+ (ve.message||'') +') networkState='+video.networkState+' readyState='+video.readyState); }
                else appendMsg('Video element reported an error.');
                if(!video.__triedProxy){ video.__triedProxy=true; video.src=proxiedSrc; msg.textContent='محاولة تشغيل عبر الخادم الوسيط...'; // also test proxy reachability
                    testProxy(proxiedSrc).then(s=>appendMsg('Proxy check: '+s)).catch(err=>appendMsg('Proxy check failed: '+(err && err.message)));
                    return; }
                msg.textContent='فشل تشغيل الفيديو.';
            });
        } else {
            iframeWrap.style.display='block'; video.style.display='none'; iframeWrap.innerHTML='<iframe src="'+src+'" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe>'; msg.textContent='يتم تشغيل المصدر داخل إطار (iframe).';
        }
    }

    // helper: append to message area and console
    function appendMsg(t){ try{ const now = new Date().toLocaleTimeString(); msg.textContent = now + ' — ' + t; console.warn('PLAYER:',t); }catch(e){} }

    // Try a small ranged fetch to the proxy to detect reachability/status (only when proxy used)
    async function testProxy(urlToTest){
        try{
            const u = urlToTest;
            const r = await fetch(u, { method: 'GET', headers: { Range: 'bytes=0-0' } });
            return r.status + ' ' + r.statusText;
        }catch(err){ throw err; }
    }

    attachDirect();

    video.addEventListener('loadedmetadata', ()=>{ progress.max = 100; timeEl.textContent = fmt(video.currentTime)+' / '+fmt(video.duration); });
    video.addEventListener('timeupdate', ()=>{ if(isFinite(video.duration)){ const p = Math.round((video.currentTime/video.duration)*100); progress.value = p; timeEl.textContent = fmt(video.currentTime)+' / '+fmt(video.duration); } });
    video.addEventListener('play', setPlayState); video.addEventListener('pause', setPlayState); video.addEventListener('ended', setPlayState);

    btnPlay.addEventListener('click', ()=>{ if(video.paused) video.play().catch(()=>{}); else video.pause(); });
    video.addEventListener('click', ()=>{ if(video.paused) video.play().catch(()=>{}); else video.pause(); });

    progress.addEventListener('input', (e)=>{ if(isFinite(video.duration)){ const pct = e.target.value/100; video.currentTime = pct * video.duration; } });
    volume.addEventListener('input', (e)=>{ video.volume = parseFloat(e.target.value); video.muted = video.volume===0; });
    speed.addEventListener('change', (e)=>{ video.playbackRate = parseFloat(e.target.value); });
    btnFull.addEventListener('click', ()=>{ if(document.fullscreenElement) document.exitFullscreen(); else video.parentElement.requestFullscreen().catch(()=>{}); });

    try{ video.addEventListener('contextmenu',(e)=>e.preventDefault()); }catch(e){}

    setTimeout(()=>{ if(video && video.paused && !iframeWrap.innerHTML){ msg.textContent = msg.textContent || 'لم يبدأ التشغيل — قد تحتاج فتح المصدر مباشرة أو تشغيل عبر خادم (HTTP).'; } },3000);

})();
