document.addEventListener('DOMContentLoaded', () => {
    // Scroll Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach(card => {
        observer.observe(card);
    });

    // Video Play Button (Demo)
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', () => {
            alert('영상 준비 중입니다! 정익님께 빨리 영상을 찍으라고 재촉해보세요! 🎥');
        });
    }

    // Comment Button (Demo)
    const ctaBtn = document.querySelector('.cta-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            alert('사진 등록 기능은 준비중입니다. 인스타그램에 #은희정익두바이쿠키 태그와 함께 올려주세요! 📸');
        });
    }
});
