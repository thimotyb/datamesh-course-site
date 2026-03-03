(function () {
  var controls = document.querySelectorAll("[data-back-to-top]");
  document.body.classList.add("js-enabled");

  var isTicking = false;
  var isReturning = false;

  function thresholdPassed() {
    return window.scrollY > window.innerHeight;
  }

  function updateControlState() {
    var visible = thresholdPassed();
    controls.forEach(function (control) {
      control.classList.toggle("is-visible", visible);
      control.setAttribute("aria-hidden", visible ? "false" : "true");
      if (visible) control.removeAttribute("tabindex");
      else control.setAttribute("tabindex", "-1");
    });
    isTicking = false;
  }

  function queueUpdate() {
    if (isTicking) return;
    isTicking = true;
    window.requestAnimationFrame(updateControlState);
  }

  function activateTop(event) {
    var keyboard = event.type === "keydown";
    if (keyboard && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (isReturning) return;
    isReturning = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(function () {
      isReturning = false;
      queueUpdate();
    }, 450);
  }

  controls.forEach(function (control) {
    control.addEventListener("click", activateTop);
    control.addEventListener("keydown", activateTop);
  });

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  queueUpdate();

  var lightbox = document.getElementById("lightbox");
  var lbImage = document.getElementById("lightbox-image");
  var lbCaption = document.getElementById("lightbox-caption");
  var openSource = null;

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lbImage.removeAttribute("src");
    lbCaption.textContent = "";
    document.body.style.overflow = "";
    openSource = null;
  }

  function openLightboxFrom(img) {
    if (!lightbox || !img) return;
    var src = img.getAttribute("src");
    var cap = img.getAttribute("data-caption") || img.getAttribute("alt") || "Figure";

    if (openSource === src && lightbox.classList.contains("open")) {
      closeLightbox();
      return;
    }

    openSource = src;
    lbImage.setAttribute("src", src);
    lbCaption.textContent = cap;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.querySelectorAll(".zoomable").forEach(function (img) {
    img.setAttribute("tabindex", "0");
    img.addEventListener("click", function () { openLightboxFrom(img); });
    img.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightboxFrom(img);
      }
    });
  });

  if (lightbox) {
    lightbox.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLightbox();
    });
  }
})();
