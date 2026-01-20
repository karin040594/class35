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

// Mock Data for Fallback
const MOCK_DATA = [
    { jmCd: '1320', jmNm: '정보처리기사', seriesNm: '기사', engJmNm: 'Engineer Information Processing', instiNm: '한국산업인력공단' },
    { jmCd: '1321', jmNm: '정보보안기사', seriesNm: '기사', engJmNm: 'Engineer Information Security', instiNm: '한국방송통신전파진흥원' },
    { jmCd: '0752', jmNm: '전기기사', seriesNm: '기사', engJmNm: 'Engineer Electricity', instiNm: '한국산업인력공단' },
    { jmCd: '0001', jmNm: '건축사', seriesNm: '전문자격', engJmNm: 'Registered Architect', instiNm: '대한건축사협회' },
    { jmCd: '0191', jmNm: '제과기능사', seriesNm: '기능사', engJmNm: 'Craftsman Confectionery Making', instiNm: '한국산업인력공단' },
    { jmCd: '0201', jmNm: '제빵기능사', seriesNm: '기능사', engJmNm: 'Craftsman Bread Making', instiNm: '한국산업인력공단' },
    { jmCd: '0830', jmNm: '위험물산업기사', seriesNm: '산업기사', engJmNm: 'Industrial Engineer Hazardous Materials', instiNm: '한국산업인력공단' },
    { jmCd: '2283', jmNm: '산업안전기사', seriesNm: '기사', engJmNm: 'Engineer Industrial Safety', instiNm: '한국산업인력공단' },
    { jmCd: '2290', jmNm: '건설안전기사', seriesNm: '기사', engJmNm: 'Engineer Construction Safety', instiNm: '한국산업인력공단' },
    { jmCd: '0731', jmNm: '소방설비기사(전기)', seriesNm: '기사', engJmNm: 'Engineer Fire Fighting System(Electrical)', instiNm: '한국산업인력공단' }
];

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
        console.log("Attempting to fetch API via Proxy...");
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
            // Try check for error message
            const failMsg = xmlDoc.querySelector('cmmMsgHeader > returnAuthMsg');
            if (failMsg) throw new Error(`API Auth Error: ${failMsg.textContent}`);
            // If literally empty but no error, might just be empty or parsing issue.
            // throw new Error("No items found");
        }

        allQualifications = Array.from(items).map(item => {
            return {
                jmCd: item.querySelector('jmCd')?.textContent || '',
                jmNm: item.querySelector('jmNm')?.textContent || '',
                engJmNm: item.querySelector('engJmNm')?.textContent || '',
                instiNm: item.querySelector('instiNm')?.textContent || '',
                seriesNm: item.querySelector('seriesNm')?.textContent || '',
                obligationFee: item.querySelector('contents')?.textContent || '',
            };
        });

        if (allQualifications.length === 0) throw new Error("Parsed data is empty");

        renderCards(allQualifications);
        showState('grid');

    } catch (error) {
        console.error('Fetch Error:', error);
        console.log("Falling back to Mock Data...");

        // Use Mock Data
        allQualifications = MOCK_DATA;
        renderCards(allQualifications);
        showState('grid');

        // Show a small toast or non-intrusive alert about Mock Data
        const errorBanner = document.createElement('div');
        errorBanner.style.cssText = `
            background: #f59e0b; color: #fff; padding: 10px; text-align: center;
            border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;
        `;
        errorBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> API 호출 실패(${error.message}). <br><b>체험용 데이터를 표시합니다.</b>`;
        resultsGrid.parentNode.insertBefore(errorBanner, resultsGrid);
    }
}

function renderCards(data) {
    resultsGrid.innerHTML = '';

    if (data.length === 0) {
        showState('empty');
        return;
    }

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
        const targetUrl = `${DETAIL_URL}?serviceKey=${API_KEY}&jmCd=${item.jmCd}`;
        const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");

        const textData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");
        const detailItem = xmlDoc.querySelector('item');
        const summary = detailItem?.querySelector('contents')?.textContent || '';
        const displaySummary = summary.length > 20 ? summary : `${item.jmNm}에 대한 상세한 시험 일정 및 자격 조건은 Q-Net 공식 홈페이지에서 확인하실 수 있습니다.`;
        const ministry = detailItem?.querySelector('ministry')?.textContent || '정보 없음';

        renderModalContent(item, displaySummary, ministry, item.instiNm);

    } catch (e) {
        // Fallback detail
        console.warn("Detail fetch failed, showing generic info", e);
        const fallbackSummary = `[체험용 데이터] ${item.jmNm} 자격증은 관련 분야의 전문 지식을 검증합니다.<br>이 내용은 API 호출 실패 시 보여지는 예시입니다.`;
        renderModalContent(item, fallbackSummary, '관련 부처 정보 없음', item.instiNm);
    }
}

function renderModalContent(item, summary, ministry, instiNm) {
    modalBody.innerHTML = `
        <div class="modal-title-group">
            <div class="card-series" style="margin-bottom:0.5rem">${item.seriesNm}</div>
            <div class="modal-title">${item.jmNm}</div>
            <p style="color:var(--text-secondary)">${item.engJmNm || ''}</p>
        </div>
        
        <div class="info-grid">
            <div class="info-item">
                <h4>시행 기관</h4>
                <p>${instiNm || '한국산업인력공단'}</p>
            </div>
            <div class="info-item">
                <h4>개요</h4>
                <p>${summary}</p>
            </div>
            <div class="info-item">
                <h4>관련 부처</h4>
                <p>${ministry}</p>
            </div>
             <div class="info-item">
                 <a href="http://www.q-net.or.kr" target="_blank" class="search-button" style="display:inline-block; text-decoration:none; text-align:center; padding: 0.5rem 1rem; font-size: 0.9rem;">
                    Q-Net 바로가기 <i class="fa-solid fa-external-link-alt" style="margin-left:5px"></i>
                 </a>
            </div>
        </div>
    `;
}
