// player.js: parse query params and initialize video or iframe playback
(function(){
    function qs(name){
        const params = new URLSearchParams(location.search);
        return params.get(name);
    }

    const src = qs('src');
    const title = qs('title') || 'مشاهدة';
    const poster = qs('poster') || '';
    const elTitle = document.getElementById('player-title');
    const video = document.getElementById('video');
    const iframeWrap = document.getElementById('iframe-wrap');
    const msg = document.getElementById('player-message');

    elTitle.textContent = title;
    if(poster) video.setAttribute('poster', poster);

    if(!src){
        msg.textContent = 'لم يتم توفير رابط الفيديو.';
        return;
    }

    // no external-open buttons per configuration

    // Determine playback method
    const lower = src.toLowerCase();
    const isM3u8 = lower.indexOf('.m3u8') !== -1;
    const isVideoFile = lower.match(/\.(mp4|webm|ogg)(\?|$)/);
    // prefer direct source first; fall back to proxy if necessary
    const directSrc = src;
    const proxiedSrc = '/proxy?url=' + encodeURIComponent(src);

    if(isM3u8){
        if(window.Hls && Hls.isSupported()){
            const hls = new Hls();
            hls.on(Hls.Events.ERROR, function(event, data){
                console.warn('HLS error', data);
                if(data && data.fatal){
                    // try proxy fallback once
                    if(!hls.__triedProxy){
                        hls.__triedProxy = true;
                        hls.loadSource(proxiedSrc);
                        return;
                    }
                    msg.textContent = 'فشل تشغيل البث (HLS). افتح المصدر في علامة جديدة.';
                }
            });
            // try direct source first
            hls.loadSource(directSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function(){ video.play().catch(()=>{}); });
        } else if(video.canPlayType('application/vnd.apple.mpegurl')){
            // try direct then proxy on error
            video.src = directSrc;
            video.addEventListener('error', function(){ if(!video.__triedProxy){ video.__triedProxy = true; video.src = proxiedSrc; } });
            video.addEventListener('loadedmetadata', ()=> video.play().catch(()=>{}));
        } else {
            // fallback to iframe if provided by server
            iframeWrap.style.display = 'block';
            video.style.display = 'none';
            iframeWrap.innerHTML = '<iframe src="' + src + '" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe>';
            msg.textContent = 'يتم تشغيل المصدر داخل إطار (iframe).';
        }
    } else if(isVideoFile){
        // try direct URL first; fall back to proxy on error
        try{ video.controlsList = 'nodownload'; }catch(e){}
        video.src = directSrc;
        video.addEventListener('loadedmetadata', ()=> video.play().catch(()=>{}));
        video.addEventListener('error', function(e){
            console.warn('Video element error with direct src', e);
            if(!video.__triedProxy){
                video.__triedProxy = true;
                video.src = proxiedSrc;
                msg.textContent = 'محاولة تشغيل عبر الخادم الوسيط...';
                return;
            }
            console.error('Video element error', e);
            msg.textContent = 'فشل تشغيل الفيديو في المشغل. افتح المصدر في علامة جديدة.';
        });
    } else {
        // unknown: try iframe embed
        iframeWrap.style.display = 'block';
        video.style.display = 'none';
        iframeWrap.innerHTML = '<iframe src="' + src + '" frameborder="0" allowfullscreen style="width:100%;height:100%"></iframe>';
        msg.textContent = 'يتم تشغيل المصدر داخل إطار (iframe).';
    }

    // If playback doesn't start within a few seconds, hint the user to open the source
    setTimeout(()=>{
        if(video && video.paused && !iframeWrap.innerHTML){
            // may be blocked by CORS or autoplay policies
            msg.textContent = msg.textContent || 'لم يبدأ التشغيل — قد تحتاج فتح المصدر مباشرة أو تشغيل عبر خادم (HTTP).';
        }
    },3000);

    // additionally block context menu on video element (some browsers still allow Save As)
    try{ video.addEventListener('contextmenu', function(e){ e.preventDefault(); }); }catch(e){}
})();
