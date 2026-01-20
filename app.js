const API_KEY = '53a2c26da0867ca4805e767d824c0f0777dd8ce16d061da381119f2377374f86';
// NOTE: Using a CORS proxy might be necessary if direct calls fail from browser.
// However, the q-net API might strictly enforce HTTP referrers or not support CORS well.
// For this demo, we will try direct calls. If CORS fails, we advise the user to disable CORS or use a proxy.
const BASE_URL = 'http://openapi.q-net.or.kr/api/service/rest/InquiryListNationalQualifcationSVC/getList';
const DETAIL_URL = 'http://openapi.q-net.or.kr/api/service/rest/InquiryInformationTradeNTQSVC/getList';
// CORS Proxy to bypass browser restrictions
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

// State
let allQualifications = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchQualifications();

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});

async function fetchQualifications() {
    showState('loading');

    try {
        // Construct the text URL first
        const targetUrl = `${BASE_URL}?serviceKey=${API_KEY}&numOfRows=1000&pageNo=1`;
        // Wrap with proxy
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const textData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");

        // Parse XML to Object Array
        const items = xmlDoc.querySelectorAll('item');

        if (items.length === 0) {
            // Check for API errors in the response
            const failMsg = xmlDoc.querySelector('cmmMsgHeader > returnAuthMsg');
            if (failMsg) throw new Error(failMsg.textContent);
        }

        allQualifications = Array.from(items).map(item => {
            return {
                jmCd: item.querySelector('jmCd')?.textContent || '', // Code
                jmNm: item.querySelector('jmNm')?.textContent || '', // Name
                engJmNm: item.querySelector('engJmNm')?.textContent || '', // English Name
                instiNm: item.querySelector('instiNm')?.textContent || '', // Institution
                seriesNm: item.querySelector('seriesNm')?.textContent || '', // Series (e.g. Engineer)
                obligationFee: item.querySelector('contents')?.textContent || '', // Sometimes contains fee or other info
            };
        });

        renderCards(allQualifications);
        showState('grid');

    } catch (error) {
        console.error('Fetch Error:', error);
        errorMessage.innerHTML = `
            데이터를 불러올 수 없습니다.<br>
            <span style="font-size:0.9rem; color:#faa">${error.message}</span>
            <br><br>
            <span style="font-size:0.8rem; color:#ccc">
            * 공공데이터포털 API 서버 상태에 따라 응답이 지연되거나 실패할 수 있습니다.<br>
            * 잠시 후 다시 시도해 주세요.
            </span>
        `;
        showState('error');
    }
}

function renderCards(data) {
    resultsGrid.innerHTML = '';

    if (data.length === 0) {
        showState('empty');
        return;
    }

    // Limiting render for performance if the list is huge, but pagination handles it in API usually.
    // Here we just render all fetched (up to 1000).
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-code">${item.jmCd}</div>
            <div class="card-title">${item.jmNm}</div>
            <div class="card-series">${item.seriesNm}</div>
        `;
        card.addEventListener('click', () => openDetail(item));
        resultsGrid.appendChild(card);
    });
}

function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        renderCards(allQualifications);
        return;
    }

    const filtered = allQualifications.filter(item =>
        item.jmNm.toLowerCase().includes(query) ||
        item.seriesNm.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        showState('empty');
    } else {
        renderCards(filtered);
        showState('grid');
    }
}

function showState(state) {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    resultsGrid.classList.add('hidden');

    switch (state) {
        case 'loading':
            loadingState.classList.remove('hidden');
            break;
        case 'error':
            errorState.classList.remove('hidden');
            break;
        case 'empty':
            emptyState.classList.remove('hidden');
            break;
        case 'grid':
            resultsGrid.classList.remove('hidden');
            break;
    }
}

async function openDetail(item) {
    modal.classList.remove('hidden');
    modalBody.innerHTML = `
        <div class="modal-loading">
            <div class="loader"></div>
            <p>상세 정보 로딩 중...</p>
        </div>
    `;

    try {
        // Fetch details
        // Note: The second API provided (InquiryInformationTradeNTQSVC) might need jmCd
        const targetUrl = `${DETAIL_URL}?serviceKey=${API_KEY}&jmCd=${item.jmCd}`;
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(url);
        const textData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");

        const detailItem = xmlDoc.querySelector('item');

        // Sometimes detail API structure differs or returns minimal info. 
        // We will try to extract common fields.

        const summary = detailItem?.querySelector('contents')?.textContent || '상세 정보가 없습니다.';
        // Many public data APIs use inconsistent tag names. 
        // For now, let's display the header info and whatever we get.

        // Mocking detailed text for better UX if API returns little
        const displaySummary = summary.length > 20 ? summary : `${item.jmNm}에 대한 상세한 시험 일정 및 자격 조건은 Q-Net 공식 홈페이지에서 확인하실 수 있습니다.`;

        modalBody.innerHTML = `
            <div class="modal-title-group">
                <div class="card-series" style="margin-bottom:0.5rem">${item.seriesNm}</div>
                <div class="modal-title">${item.jmNm}</div>
                <p style="color:var(--text-secondary)">${item.engJmNm}</p>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <h4>시행 기관</h4>
                    <p>${item.instiNm || '한국산업인력공단'}</p>
                </div>
                <div class="info-item">
                    <h4>개요</h4>
                    <p>${displaySummary}</p>
                </div>
                <div class="info-item">
                    <h4>관련 부처</h4>
                    <p>${detailItem?.querySelector('ministry')?.textContent || '정보 없음'}</p>
                </div>
                 <div class="info-item">
                     <a href="http://www.q-net.or.kr" target="_blank" class="search-button" style="display:inline-block; text-decoration:none; text-align:center; padding: 0.5rem 1rem; font-size: 0.9rem;">
                        Q-Net 바로가기 <i class="fa-solid fa-external-link-alt" style="margin-left:5px"></i>
                     </a>
                </div>
            </div>
        `;

    } catch (e) {
        modalBody.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:2rem; color: #ef4444; margin-bottom:1rem;"></i>
                <p>상세 정보를 불러올 수 없습니다.</p>
            </div>
        `;
    }
}
