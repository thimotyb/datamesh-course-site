(function () {
  var controls = document.querySelectorAll("[data-back-to-top]");
  var printControl = document.querySelector("[data-print-page]");
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

  function createPrintControl() {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "print-page";
    button.setAttribute("data-print-page", "");
    button.setAttribute("aria-label", "Print module");
    button.title = "Print";
    button.innerHTML =
      '<span class="print-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" focusable="false">' +
      '<path d="M6 9V3h12v6H6zm10-2V5H8v2h8zM6 19v2h12v-2H6zm13-1v-3h2v-4a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v4h2v3h14zm-2-2H7v-4h10v4z"/>' +
      "</svg>" +
      "</span>" +
      '<span class="print-label">Print</span>';
    document.body.appendChild(button);
    return button;
  }

  function activatePrint(event) {
    event.preventDefault();
    closeLightbox();
    window.print();
  }

  if (!printControl) {
    printControl = createPrintControl();
  }
  printControl.addEventListener("click", activatePrint);

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

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseHeadingLevel(title) {
    var match = String(title || "").match(/\b(\d+)(?:\.(\d+))?\b/);
    if (!match) return null;
    return { major: match[1], minor: match[2] || null };
  }

  function getHeadingTargetId(heading) {
    if (heading.id) return heading.id;
    var parentSection = heading.closest("section.study-section");
    if (parentSection && parentSection.id) return parentSection.id;
    var generated = "h-" + slugify(heading.textContent || "section");
    heading.id = generated;
    return generated;
  }

  function buildModuleStructurePanel() {
    var article = document.querySelector("main.content article");
    if (!article) return;

    var headings = Array.from(
      article.querySelectorAll(
        "section.study-section > h2, section.study-section h3",
      ),
    );
    if (!headings.length) return;

    var tree = [];
    var currentL1 = null;

    headings.forEach(function (heading, index) {
      var text = (heading.textContent || "").trim();
      var id = getHeadingTargetId(heading);
      var levelInfo = parseHeadingLevel(text);
      var isH3 = heading.tagName.toLowerCase() === "h3";
      var isSecondLevel = isH3 || (levelInfo && levelInfo.minor);

      if (!isSecondLevel) {
        currentL1 = { id: id, title: text, children: [] };
        tree.push(currentL1);
        return;
      }

      if (!currentL1) {
        currentL1 = {
          id: getHeadingTargetId(headings[Math.max(index - 1, 0)]),
          title: "1",
          children: [],
        };
        tree.push(currentL1);
      }

      currentL1.children.push({ id: id, title: text });
    });

    if (!tree.length) return;

    var panel = document.createElement("aside");
    panel.className = "module-structure-panel";
    panel.setAttribute("aria-label", "Module structure");

    var panelHeader = document.createElement("div");
    panelHeader.className = "module-structure-header";

    var panelTitle = document.createElement("h2");
    panelTitle.textContent = "Structure";
    panelHeader.appendChild(panelTitle);

    var collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "module-structure-collapse";
    collapseBtn.setAttribute("aria-expanded", "true");
    collapseBtn.setAttribute("aria-label", "Collapse structure");
    collapseBtn.textContent = "⟨";
    panelHeader.appendChild(collapseBtn);
    panel.appendChild(panelHeader);

    var nav = document.createElement("nav");
    nav.className = "module-structure-nav";
    nav.setAttribute("aria-label", "Heading navigation");
    var list = document.createElement("ul");
    list.className = "module-structure-tree";

    var navLinksById = {};

    tree.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "lvl1";

      var row = document.createElement("div");
      row.className = "tree-row";

      var childList = null;
      if (item.children.length) {
        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "tree-toggle";
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Collapse subsection");
        toggle.textContent = "▾";
        row.appendChild(toggle);

        childList = document.createElement("ul");
        childList.className = "lvl2-list";
        item.children.forEach(function (child) {
          var childLi = document.createElement("li");
          childLi.className = "lvl2";
          var childA = document.createElement("a");
          childA.href = "#" + child.id;
          childA.textContent = child.title;
          childLi.appendChild(childA);
          childList.appendChild(childLi);
        });

        toggle.addEventListener("click", function () {
          var expanded = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
          toggle.textContent = expanded ? "▸" : "▾";
          if (expanded) childList.classList.add("collapsed");
          else childList.classList.remove("collapsed");
        });
      } else {
        var spacer = document.createElement("span");
        spacer.className = "tree-spacer";
        spacer.setAttribute("aria-hidden", "true");
        row.appendChild(spacer);
      }

      var a = document.createElement("a");
      a.href = "#" + item.id;
      a.textContent = item.title;
      a.dataset.targetId = item.id;
      navLinksById[item.id] = a;
      row.appendChild(a);
      li.appendChild(row);
      if (childList) li.appendChild(childList);
      list.appendChild(li);
    });

    nav.appendChild(list);
    panel.appendChild(nav);

    var content = document.querySelector("main.content");
    if (content) content.prepend(panel);
    else document.body.appendChild(panel);
    document.body.classList.add("has-module-structure");

    collapseBtn.addEventListener("click", function () {
      var expanded = collapseBtn.getAttribute("aria-expanded") === "true";
      collapseBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
      collapseBtn.textContent = expanded ? "⟩" : "⟨";
      document.body.classList.toggle("module-structure-collapsed", expanded);
    });

    var activeId = null;
    function setActiveLink(id) {
      if (!id || !navLinksById[id] || activeId === id) return;
      if (activeId && navLinksById[activeId]) {
        navLinksById[activeId].classList.remove("is-active");
        navLinksById[activeId].removeAttribute("aria-current");
      }
      navLinksById[id].classList.add("is-active");
      navLinksById[id].setAttribute("aria-current", "location");
      activeId = id;
    }

    function getCurrentHeadingId() {
      var viewportTop = 120;
      var current = null;
      headings.forEach(function (heading) {
        var rect = heading.getBoundingClientRect();
        if (rect.top <= viewportTop) current = getHeadingTargetId(heading);
      });
      if (current) return current;
      return getHeadingTargetId(headings[0]);
    }

    function syncActiveHeading() {
      setActiveLink(getCurrentHeadingId());
    }

    window.addEventListener("scroll", syncActiveHeading, { passive: true });
    window.addEventListener("resize", syncActiveHeading);
    syncActiveHeading();
  }

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
    var cap =
      img.getAttribute("data-caption") || img.getAttribute("alt") || "Figure";

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
    img.addEventListener("click", function () {
      openLightboxFrom(img);
    });
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

  buildModuleStructurePanel();
})();
