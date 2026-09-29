/* Behaviour for the Travels page (/travels/). Markup and styles live in _pages/travels.html.
   Kept in its own file because _layouts/default.html applies the `compress` layout, which
   collapses newlines in inline scripts and only does so in production. */
(function () {
  var doc = document;
  var trips = doc.querySelectorAll("details.trip");
  if (!trips.length) return;

  /* /travels/#da-lat-vietnam opens that place, so a single trip can be linked to */
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = doc.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      el.scrollIntoView({ block: "start" });
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  /* landscape photos take the whole row, portrait photos sit two per row.
     naturalWidth/Height already account for the EXIF rotation flag, so an
     iPhone portrait shot counts as portrait. */
  function mark(img) {
    if (img.naturalWidth > img.naturalHeight * 1.15) img.parentNode.classList.add("wide");
  }
  Array.prototype.forEach.call(doc.querySelectorAll(".ph img"), function (img) {
    if (img.complete && img.naturalWidth) mark(img);
    else img.addEventListener("load", function () { mark(img); });
  });

  /* lightbox: click a photo to enlarge; arrows or swipe-free taps to move; Esc or click to close */
  var dlg = doc.createElement("dialog");
  dlg.className = "lb";
  dlg.innerHTML = '<img alt=""><div class="cap"></div>';
  doc.body.appendChild(dlg);
  var big = dlg.querySelector("img"), cap = dlg.querySelector(".cap");
  var set = [], idx = 0;

  function show(i) {
    idx = (i + set.length) % set.length;
    var src = set[idx];
    big.src = src.currentSrc || src.src;
    big.alt = src.alt;
    cap.textContent = src.getAttribute("data-cap") || "";
    if (set.length > 1) {
      var n = doc.createElement("span");
      n.textContent = (idx + 1) + " / " + set.length;
      cap.appendChild(n);
    }
  }
  function close() { dlg.close(); }

  doc.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".ph img");
    if (!img) return;
    set = Array.prototype.slice.call(img.closest(".trip-photos").querySelectorAll(".ph img"));
    show(set.indexOf(img));
    dlg.showModal();
    doc.documentElement.style.overflow = "hidden";
  });
  dlg.addEventListener("click", function (e) {
    if (e.target === big) {
      /* clicking the right half of the photo goes forward, the left half back */
      var r = big.getBoundingClientRect();
      if (set.length > 1 && e.clientX - r.left > r.width * 0.5) show(idx + 1);
      else if (set.length > 1) show(idx - 1);
      else close();
    } else close();
  });
  dlg.addEventListener("close", function () { doc.documentElement.style.overflow = ""; });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
  });
})();
