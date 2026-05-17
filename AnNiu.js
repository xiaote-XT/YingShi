// AnNiu.js - 右下角悬浮收藏按钮（大半屏版）【弹出动画版】
(function() {
    'use strict';

    // ---------- 配置 ----------
    const STORAGE_KEY = 'favorites';
    const PANEL_WIDTH = 'min(600px, 85vw)';
    const PANEL_HEIGHT = 'min(600px, 80vh)';
    const BUTTON_SIZE = 50;

    // ---------- 工具函数 ----------
    function getFavorites() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        let data;
        try {
            data = JSON.parse(stored);
        } catch {
            return [];
        }

        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            const newData = data.map(url => ({
                movieName: '未知影片',
                episodeName: extractNameFromUrl(url),
                url: url
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            return newData;
        }

        if (Array.isArray(data) && data.every(item => item && typeof item === 'object' && 'url' in item && !('movieName' in item))) {
            const newData = data.map(item => ({
                movieName: '未知影片',
                episodeName: item.name || extractNameFromUrl(item.url),
                url: item.url
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            return newData;
        }

        if (Array.isArray(data) && data.every(item => item && typeof item === 'object' && 'url' in item && 'movieName' in item && 'episodeName' in item)) {
            return data;
        }

        return [];
    }

    function saveFavorites(favArray) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favArray));
    }

    function toggleFavoriteItem(item) {
        const fav = getFavorites();
        const index = fav.findIndex(f => f.url === item.url);
        if (index !== -1) {
            fav.splice(index, 1);
        } else {
            fav.push(item);
        }
        saveFavorites(fav);
        return index === -1;
    }

    function isFavorite(url) {
        const fav = getFavorites();
        return fav.some(f => f.url === url);
    }

    function extractNameFromUrl(url) {
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(p => p);
            let name = parts.pop() || u.hostname;
            name = decodeURIComponent(name).substring(0, 30);
            return name || url;
        } catch {
            return url;
        }
    }

    function isXuanJiPage() {
        return window.location.href.includes('XuanJi.html');
    }

    function getCurrentMovieName() {
        if (!isXuanJiPage()) return null;
        const titleEl = document.querySelector('.video-title');
        return titleEl ? titleEl.textContent.trim() : '未知影片';
    }

    function parseCurrentEpisodes() {
        if (!isXuanJiPage()) return [];

        const episodes = [];
        const movieName = getCurrentMovieName() || '未知影片';
        document.querySelectorAll('.playlist-item[data-url]').forEach(el => {
            const url = el.getAttribute('data-url');
            const episodeName = el.textContent.trim();
            if (url && episodeName) {
                episodes.push({ movieName, episodeName, url, element: el });
            }
        });
        return episodes;
    }

    function updateEpisodeButtonsStar() {
        if (!isXuanJiPage()) return;
        const fav = getFavorites();
        document.querySelectorAll('.playlist-item[data-url]').forEach(el => {
            const url = el.getAttribute('data-url');
            if (fav.some(f => f.url === url)) {
                el.classList.add('starred');
            } else {
                el.classList.remove('starred');
            }
        });
    }

    function createUI() {
        const style = document.createElement('style');
        style.textContent = `
            #favorite-float-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: ${BUTTON_SIZE}px;
                height: ${BUTTON_SIZE}px;
                background-color: #ff6a00;
                border-radius: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 999999;
                transition: background-color 0.2s ease, box-shadow 0.2s ease;
                color: white;
                font-size: 22px;
                line-height: 1;
                user-select: none;
            }
            #favorite-float-btn:hover {
                background-color: #e55a00;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            #favorite-float-btn:active {
                box-shadow: 0 2px 14px rgba(0,0,0,0.5);
                transition: box-shadow 0.1s ease;
            }
            #favorite-panel {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: ${PANEL_WIDTH};
                height: ${PANEL_HEIGHT};
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,106,0,0.3);
                display: none;
                flex-direction: column;
                z-index: 999998;
                overflow: hidden;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                opacity: 0;
                transform: scale(0.3); /* 从0.3开始，为弹出做准备 */
                transform-origin: right bottom;
                transition: opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性曲线 */
                pointer-events: none;
            }
            #favorite-panel.show {
                opacity: 1;
                transform: scale(1);
                pointer-events: auto;
                display: flex;
            }
            #favorite-panel-header {
                padding: 20px 20px 8px 20px;
                background: white;
                color: #333;
                font-weight: 700;
                font-size: 18px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: none;
            }
            .header-divider {
                width: 60px;
                height: 2px;
                background-color: #ccc;
                margin: 0 0 8px 20px; /* 左对齐 */
            }
            #favorite-panel-header .close-btn {
                cursor: pointer;
                font-size: 24px;
                line-height: 1;
                opacity: 0.8;
                transition: opacity 0.2s;
                font-weight: 700;
            }
            #favorite-panel-header .close-btn:hover {
                opacity: 1;
            }
            #favorite-search {
                padding: 8px 16px 12px 16px;
                background: white;
                border-bottom: 1px solid #eee;
            }
            #favorite-search input {
                width: 100%;
                padding: 10px 16px;
                border: 1px solid #ddd;
                border-radius: 16px;
                font-size: 15px;
                outline: none;
                box-sizing: border-box;
                transition: border-color 0.2s;
            }
            #favorite-search input:focus {
                border-color: #ff6a00;
            }
            #favorite-tabs {
                display: flex;
                border-bottom: 1px solid #ddd;
                background: #f5f5f5;
            }
            .favorite-tab {
                flex: 1;
                text-align: center;
                padding: 12px 0;
                cursor: pointer;
                font-size: 15px;
                color: #666;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }
            .favorite-tab.active {
                color: #ff6a00;
                border-bottom-color: #ff6a00;
                font-weight: 600;
                background: white;
            }
            #favorite-list-container {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
                background: white;
            }
            .favorite-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            .favorite-item {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                border-bottom: 1px solid #f0f0f0;
                font-size: 15px;
                transition: background-color 0.2s ease;
            }
            .favorite-item:hover {
                background-color: #f5f5f5;
            }
            .favorite-item a {
                flex: 1;
                color: #333;
                text-decoration: none;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                margin-right: 12px;
            }
            .favorite-item a:hover {
                color: #ff6a00;
                text-decoration: underline;
            }
            .favorite-star {
                cursor: pointer;
                font-size: 24px;
                line-height: 1;
                color: #ccc;
                transition: color 0.2s, transform 0.2s;
                flex-shrink: 0;
                width: 32px;
                text-align: center;
                text-shadow: 0 0 2px rgba(0,0,0,0.1);
            }
            .favorite-star.starred {
                color: #ff6a00;
                text-shadow: 0 0 4px rgba(255,106,0,0.2);
            }
            .favorite-star:hover {
                transform: scale(1.2);
            }
            .favorite-empty {
                padding: 40px 20px;
                text-align: center;
                color: #999;
                font-size: 16px;
            }
            #favorite-current-section {
                border-top: 1px solid #ddd;
                background: #fafafa;
            }
            #favorite-current-header {
                padding: 14px 20px;
                font-weight: 600;
                font-size: 16px;
                color: #333;
                background: #f0f0f0;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
            }
            #favorite-current-header .toggle-icon {
                font-size: 18px;
                transition: transform 0.2s;
            }
            #favorite-current-list {
                max-height: 250px;
                overflow-y: auto;
                transition: max-height 0.25s ease;
            }
            #favorite-current-list.collapsed {
                max-height: 0;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('div');
        btn.id = 'favorite-float-btn';
        btn.innerHTML = '★';
        btn.title = '打开收藏夹';
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'favorite-panel';
        panel.innerHTML = `
            <div id="favorite-panel-header">
                <span>我的收藏</span>
                <span class="close-btn" id="favorite-close-btn">✕</span>
            </div>
            <div class="header-divider"></div>
            <div id="favorite-search">
                <input type="text" placeholder="搜索影片或集数..." id="favorite-search-input">
            </div>
            <div id="favorite-tabs" style="display: ${isXuanJiPage() ? 'flex' : 'none'};">
                <div class="favorite-tab active" data-tab="all">全部收藏</div>
                <div class="favorite-tab" data-tab="current">当前剧集</div>
            </div>
            <div id="favorite-list-container">
                <ul id="favorite-all-list" class="favorite-list"></ul>
                <div id="favorite-current-section" style="display: none;">
                    <div id="favorite-current-header">
                        <span>当前剧集</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div id="favorite-current-list" class="favorite-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        return { btn, panel };
    }

    function renderAllList(filterText = '') {
        const container = document.getElementById('favorite-all-list');
        if (!container) return;

        const fav = getFavorites();
        let items = [...fav];

        if (filterText) {
            const lower = filterText.toLowerCase();
            items = items.filter(item => 
                item.movieName.toLowerCase().includes(lower) || 
                item.episodeName.toLowerCase().includes(lower) ||
                item.url.toLowerCase().includes(lower)
            );
        }

        if (items.length === 0) {
            container.innerHTML = '<li class="favorite-empty">暂无收藏，长按集数可添加</li>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const displayText = `${escapeHtml(item.movieName)} 丨 ${escapeHtml(item.episodeName)}`;
            html += `
                <li class="favorite-item" data-url="${item.url}">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="${displayText}">${displayText}</a>
                    <span class="favorite-star starred" data-url="${item.url}" data-movie="${escapeHtml(item.movieName)}" data-episode="${escapeHtml(item.episodeName)}">★</span>
                </li>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.favorite-star').forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const url = star.getAttribute('data-url');
                const movieName = star.getAttribute('data-movie');
                const episodeName = star.getAttribute('data-episode');
                toggleFavoriteItem({ movieName, episodeName, url });
                renderAllList(document.getElementById('favorite-search-input').value.trim());
                updateCurrentListStar(url, false);
                updateEpisodeButtonsStar();
            });
        });
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    }

    function updateCurrentListStar(url, starred) {
        const currentItems = document.querySelectorAll('#favorite-current-list .favorite-item');
        currentItems.forEach(item => {
            if (item.dataset.url === url) {
                const star = item.querySelector('.favorite-star');
                if (star) {
                    if (starred) star.classList.add('starred');
                    else star.classList.remove('starred');
                }
            }
        });
    }

    function renderCurrentList() {
        const container = document.getElementById('favorite-current-list');
        if (!container) return;

        const episodes = parseCurrentEpisodes();
        if (episodes.length === 0) {
            container.innerHTML = '<li class="favorite-empty">当前页面未找到剧集</li>';
            return;
        }

        const fav = getFavorites();
        let html = '';
        episodes.forEach(ep => {
            const starred = fav.some(f => f.url === ep.url);
            const displayText = `${escapeHtml(ep.movieName)} 丨 ${escapeHtml(ep.episodeName)}`;
            html += `
                <li class="favorite-item" data-url="${ep.url}">
                    <a href="${ep.url}" target="_blank" rel="noopener noreferrer" title="${displayText}">${displayText}</a>
                    <span class="favorite-star ${starred ? 'starred' : ''}" data-url="${ep.url}" data-movie="${escapeHtml(ep.movieName)}" data-episode="${escapeHtml(ep.episodeName)}">★</span>
                </li>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.favorite-star').forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const url = star.getAttribute('data-url');
                const movieName = star.getAttribute('data-movie');
                const episodeName = star.getAttribute('data-episode');
                const newState = toggleFavoriteItem({ movieName, episodeName, url });
                if (newState) {
                    star.classList.add('starred');
                } else {
                    star.classList.remove('starred');
                }
                renderAllList(document.getElementById('favorite-search-input').value.trim());
                updateEpisodeButtonsStar();
            });
        });
    }

    function bindEpisodeButtonsLongPress() {
        if (!isXuanJiPage()) return;
        const movieName = getCurrentMovieName() || '未知影片';
        document.querySelectorAll('.playlist-item[data-url]').forEach(btn => {
            btn.removeEventListener('contextmenu', handleLongPress);
            btn.addEventListener('contextmenu', handleLongPress);
        });

        function handleLongPress(e) {
            e.preventDefault();
            const btn = e.currentTarget;
            const url = btn.getAttribute('data-url');
            const episodeName = btn.textContent.trim();
            if (!url || !episodeName) return;

            const newState = toggleFavoriteItem({ movieName, episodeName, url });
            if (newState) {
                btn.classList.add('starred');
            } else {
                btn.classList.remove('starred');
            }
            const panel = document.getElementById('favorite-panel');
            if (panel && panel.classList.contains('show')) {
                refreshAll();
            }
        }
    }

    function init() {
        const { btn, panel } = createUI();

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('show');
            if (panel.classList.contains('show')) {
                refreshAll();
            }
        });

        document.getElementById('favorite-close-btn').addEventListener('click', () => {
            panel.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('show');
            }
        });

        const searchInput = document.getElementById('favorite-search-input');
        searchInput.addEventListener('input', (e) => {
            const filter = e.target.value.trim();
            renderAllList(filter);
        });

        const tabs = document.querySelectorAll('.favorite-tab');
        const allList = document.getElementById('favorite-all-list');
        const currentSection = document.getElementById('favorite-current-section');
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabType = tab.dataset.tab;
                    if (tabType === 'all') {
                        allList.style.display = 'block';
                        currentSection.style.display = 'none';
                        renderAllList(searchInput.value.trim());
                    } else {
                        allList.style.display = 'none';
                        currentSection.style.display = 'block';
                        renderCurrentList();
                    }
                });
            });
        }

        const currentHeader = document.getElementById('favorite-current-header');
        const currentList = document.getElementById('favorite-current-list');
        if (currentHeader) {
            currentHeader.addEventListener('click', () => {
                const icon = currentHeader.querySelector('.toggle-icon');
                currentList.classList.toggle('collapsed');
                icon.textContent = currentList.classList.contains('collapsed') ? '▶' : '▼';
            });
        }

        function refreshAll() {
            renderAllList(searchInput.value.trim());
            if (isXuanJiPage()) {
                renderCurrentList();
                const activeTab = document.querySelector('.favorite-tab.active');
                if (activeTab && activeTab.dataset.tab === 'current') {
                    allList.style.display = 'none';
                    currentSection.style.display = 'block';
                } else {
                    allList.style.display = 'block';
                    currentSection.style.display = 'none';
                }
            }
        }

        if (isXuanJiPage()) {
            bindEpisodeButtonsLongPress();
            updateEpisodeButtonsStar();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();