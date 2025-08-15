
(function () {
  // Supported languages
  var supported = ["en","ru","es","de","fr","pt","it","ar","zh","ja","hi","tr"];

  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function pickLanguage() {
    var fromParam = getParam("lang");
    if (fromParam && supported.includes(fromParam)) return fromParam;

    var fromStorage = localStorage.getItem("site_lang");
    if (fromStorage && supported.includes(fromStorage)) return fromStorage;

    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    // Map common browser locales to our short codes
    var map = {
      "zh-cn": "zh", "zh": "zh", "zh-tw":"zh",
      "pt-br": "pt", "pt-pt": "pt",
      "en-us":"en","en-gb":"en",
      "es-es":"es","es-419":"es",
      "de-de":"de",
      "fr-fr":"fr",
      "it-it":"it",
      "ar":"ar","ar-ae":"ar","ar-eg":"ar","ar-sa":"ar",
      "ja-jp":"ja",
      "hi-in":"hi",
      "tr-tr":"tr",
      "ru-ru":"ru"
    };
    return map[nav] || nav.split("-")[0] || "en";
  }

  function isRTL(lang) { return ["ar"].includes(lang); }

  function setLangAttributes(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL(lang) ? "rtl" : "ltr");
    // Optional: add a class for styling
    document.documentElement.classList.toggle("rtl", isRTL(lang));
  }

  function applyTranslations(dict) {
    // Replace any [data-i18n] text content
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var value = key.split(".").reduce(function(o, k){ return (o||{})[k]; }, dict);
      if (typeof value === "string") {
        // If element has data-i18n-attr, set attribute instead of text
        var attr = el.getAttribute("data-i18n-attr");
        if (attr) {
          el.setAttribute(attr, value);
        } else {
          el.textContent = value;
        }
      }
    });

    // Replace placeholders for inputs
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el){
      var key = el.getAttribute("data-i18n-placeholder");
      var value = key.split(".").reduce(function(o, k){ return (o||{})[k]; }, dict);
      if (typeof value === "string") el.setAttribute("placeholder", value);
    });

    // Update title if data-i18n-title on <title>
    var titleNode = document.querySelector("title[data-i18n]");
    if (titleNode) {
      var tkey = titleNode.getAttribute("data-i18n");
      var tval = tkey.split(".").reduce(function(o, k){ return (o||{})[k]; }, dict);
      if (typeof tval === "string") titleNode.textContent = tval;
    }
  }

  function loadJSON(url) {
    return fetch(url, {cache: "no-store"}).then(function(r){
      if (!r.ok) throw new Error("Failed to load "+url);
      return r.json();
    });
  }

  function init() {
    var lang = pickLanguage();
    if (!supported.includes(lang)) lang = "en";
    setLangAttributes(lang);
    localStorage.setItem("site_lang", lang);

    // load locales/{lang}/common.json (relative to site root)
    var base = document.currentScript && document.currentScript.getAttribute("data-base");
    var prefix = base || "";
    loadJSON(prefix + "/locales/" + lang + "/common.json")
      .then(function(dict){
        applyTranslations(dict);
        // Populate a language dropdown if present
        var sel = document.querySelector('[data-i18n-switcher]');
        if (sel) {
          sel.value = lang;
          sel.addEventListener("change", function(){
            var chosen = sel.value;
            if (!supported.includes(chosen)) return;
            var url = new URL(window.location.href);
            url.searchParams.set("lang", chosen);
            window.location.href = url.toString();
          });
        }
      })
      .catch(function(err){
        console.error(err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
