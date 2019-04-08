var nameSpaces = ['translation'];

$(document).ready(function () {
    if (typeof addNamesapces == "function") {
        nameSpaces = addNamesapces(nameSpaces);
    }

    i18next
        .use(i18nextBrowserLanguageDetector)
        .init({
            lng: "ja",
            resources: {
                en: resources_en,
                ja: resources_ja
            },
            fallbackLng: 'ja',
            ns: nameSpaces,
            defaultNS: 'translation',
            debug: true
        }, function(err, t) {
            initJqueryI18next();
            initContent();
            updateContent();
        });
});

function initJqueryI18next() {
    jqueryI18next.init(i18next, $, { 
        useOptionsAttr: true 
    }); 

    //i18next.on('languageChanged', function(lng) {
    //    updateContent();
    //});
}

function initContent() {
    if (typeof init == "function") {
        init();
    }
}

function updateContent() {
    $('[data-i18n]').localize();
}
