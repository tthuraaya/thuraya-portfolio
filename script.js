const themeToggle = document.getElementById("themeToggle");

// Apply saved theme on load (defaults to light if none saved)
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Scroll-spy: highlight the nav link for the section currently in view
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

const setActiveLink = () => {
    let currentId = "";
    const scrollPos = window.scrollY + window.innerHeight * 0.3;

    sections.forEach((section) => {
        if (scrollPos >= section.offsetTop) {
            currentId = section.id;
        }
    });

    navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
    });
};

window.addEventListener("scroll", setActiveLink);
window.addEventListener("load", setActiveLink);

// Stat number - smooth odometer slide-up animation, sequential
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const slideCountUp = (el, onDone) => {
    const text = el.dataset.target || el.textContent.trim();
    el.dataset.target = text;
    const suffix = text.replace(/[0-9]/g, "");
    const target = parseInt(text);
    const lineHeight = el.offsetHeight || 40;

    // Build a vertical strip of every number from 0 → target
    const wrapper = document.createElement("div");
    // display:block avoids the inline "strut" that display:inline-block would
    // introduce here — an inline-block child inside an inline-formatting
    // context reserves extra line-box height for the font's ascent/descent
    // even though the wrapper itself is a fixed height. That extra space is
    // what made the currently-animating number grow taller than its resting
    // siblings and visibly drop out of alignment while sliding.
    wrapper.style.cssText = `overflow:hidden;height:${lineHeight}px;display:block;`;

    const strip = document.createElement("div");
    strip.style.cssText = `display:flex;flex-direction:column;will-change:transform;`;

    for (let i = 0; i <= target; i++) {
        const span = document.createElement("span");
        span.textContent = i + suffix;
        span.style.cssText = `height:${lineHeight}px;line-height:${lineHeight}px;display:block;text-align:center;`;
        strip.appendChild(span);
    }

    wrapper.appendChild(strip);
    el.textContent = "";
    el.appendChild(wrapper);

    const totalSlide = target * lineHeight;
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(progress);
        strip.style.transform = `translateY(-${eased * totalSlide}px)`;
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            strip.style.transform = `translateY(-${totalSlide}px)`;
            if (onDone) setTimeout(onDone, 250);
        }
    };

    requestAnimationFrame(tick);
};

const statNumbers = [...document.querySelectorAll(".stat-number")];
const STATS_PLAYED_KEY = "statsAnimationPlayed";

const runSequence = () => {
    const next = (i) => {
        if (i >= statNumbers.length) return;
        slideCountUp(statNumbers[i], () => next(i + 1));
    };
    next(0);
};

const startStatObserver = () => {
    // Already played in a previous visit — just show the final values,
    // no animation, no observer needed.
    if (localStorage.getItem(STATS_PLAYED_KEY) === "true") {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                runSequence();
                localStorage.setItem(STATS_PLAYED_KEY, "true");
                observer.disconnect();
            }
        });
    }, { threshold: 0.5 });

    if (statNumbers.length > 0) {
        observer.observe(statNumbers[0].closest("section") || statNumbers[0].parentElement);
    }
};

// Wait for the webfont to finish loading before wiring up the observer.
// Otherwise the first number can be measured against the fallback font's
// line-height (taller) while the others get measured after the swap to
// Inter (shorter), which is what causes the numbers to drift out of
// alignment when the slide-up animation runs.
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startStatObserver);
} else {
    startStatObserver();
}
document.querySelectorAll(".carousel").forEach((carousel) => {
    const img = carousel.querySelector(".carousel-img");
    const images = JSON.parse(img.dataset.images);
    const dotsContainer = carousel.querySelector(".carousel-dots");
    let current = 0;

    // Build dots
    images.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => goTo(i));
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll(".dot");

    function goTo(index) {
        current = (index + images.length) % images.length;
        img.style.opacity = "0";
        setTimeout(() => {
            img.src = images[current];
            img.style.opacity = "1";
        }, 150);
        dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    carousel.querySelector(".carousel-prev").addEventListener("click", () => goTo(current - 1));
    carousel.querySelector(".carousel-next").addEventListener("click", () => goTo(current + 1));

    // Click image to open lightbox at current position
    img.addEventListener("click", () => openLightbox(images, current));
});

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let lbImages = [];
let lbIndex = 0;

const openLightbox = (images, index) => {
    lbImages = images;
    lbIndex = index;
    lightboxImg.src = lbImages[lbIndex];
    lightbox.classList.add("open");
};

const lightboxGo = (dir) => {
    lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
    lightboxImg.style.opacity = "0";
    setTimeout(() => {
        lightboxImg.src = lbImages[lbIndex];
        lightboxImg.style.opacity = "1";
    }, 120);
};

const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
};

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (e) => { e.stopPropagation(); lightboxGo(-1); });
lightboxNext.addEventListener("click", (e) => { e.stopPropagation(); lightboxGo(1); });
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxGo(-1);
    if (e.key === "ArrowRight") lightboxGo(1);
});