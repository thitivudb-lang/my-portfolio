// ============ NIGHT MODE ONLY ============
document.documentElement.setAttribute('data-theme', 'dark');

// ============ MOBILE NAV ============
const navBurger = document.getElementById('navBurger');
const nav = document.getElementById('nav');
navBurger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('.nav__link').forEach(link =>
  link.addEventListener('click', () => nav.classList.remove('open'))
);

// ============ ACTIVE NAV LINK ON SCROLL ============
const sections = document.querySelectorAll('main .section, main .hero');
const navLinks = document.querySelectorAll('.nav__link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach(section => navObserver.observe(section));

// ============ TYPED ROLE EFFECT ============
const roles = ['นักพัฒนาระบบ IoT', 'IoT & Embedded Systems Developer', 'IoT Developer', 'Software Developer', 'HyperText Markup Language'];
const typedEl = document.getElementById('typedRole');
let roleIndex = 0, charIndex = 0, deleting = false;

function typeLoop() {
  const current = roles[roleIndex];
  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1400);
      return;
    }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }
  setTimeout(typeLoop, deleting ? 45 : 85);
}
typeLoop();

// ============ PROGRESS BAR ANIMATION ON SCROLL ============
const progressFills = document.querySelectorAll('.progress-bar__fill');
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      progressObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
progressFills.forEach(fill => progressObserver.observe(fill));

// ============ SHOWCASE GALLERY DOTS ============
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const slides = gallery.querySelectorAll('.showcase-card__slide');
  const dots = gallery.querySelectorAll('.showcase-card__dot');
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const i = Number(dot.dataset.slide);
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    });
  });
});

// ============ SCROLL TO TOP BUTTON ============
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ============ CONTACT FORM ============
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  formStatus.textContent = 'กำลังส่ง...';

  try {
    const res = await fetch(contactForm.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(contactForm)
    });
    if (res.ok) {
      formStatus.textContent = 'ส่งข้อความเรียบร้อยแล้ว ขอบคุณครับ 🙏';
      contactForm.reset();
    } else {
      formStatus.textContent = 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง หรืออีเมลมาที่ thitivud.b@gmail.com';
    }
  } catch {
    formStatus.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ ลองใหม่อีกครั้ง';
  } finally {
    submitBtn.disabled = false;
  }
});

// ============ FOOTER YEAR ============
document.getElementById('year').textContent = new Date().getFullYear();
