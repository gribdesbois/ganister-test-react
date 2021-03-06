angular.module('app.ganister.config.models.translations', [
])
    .controller('translationsController', function ($scope, datamodelModel, Notification, $location) {
        $location.search({page: 'translations'});

        //  Default Scope Values
        $scope.categories = [];
        $scope.options = [];
        $scope.selectedCategory = undefined;
        $scope.selectedOption = undefined;
        $scope.selectedLanguage = undefined;
        $scope.translations = {};
        $scope.languages = [];
        $scope.listOfLanguages = [
            { "key": "ab", "name": "Abkhaz", "nativeName": "аҧсуа" },
            { "key": "aa", "name": "Afar", "nativeName": "Afaraf" },
            { "key": "af", "name": "Afrikaans", "nativeName": "Afrikaans" },
            { "key": "ak", "name": "Akan", "nativeName": "Akan" },
            { "key": "sq", "name": "Albanian", "nativeName": "Shqip" },
            { "key": "am", "name": "Amharic", "nativeName": "አማርኛ" },
            { "key": "ar", "name": "Arabic", "nativeName": "العربية" },
            { "key": "an", "name": "Aragonese", "nativeName": "Aragonés" },
            { "key": "hy", "name": "Armenian", "nativeName": "Հայերեն" },
            { "key": "as", "name": "Assamese", "nativeName": "অসমীয়া" },
            { "key": "av", "name": "Avaric", "nativeName": "авар мацӀ, магӀарул мацӀ" },
            { "key": "ae", "name": "Avestan", "nativeName": "avesta" },
            { "key": "ay", "name": "Aymara", "nativeName": "aymar aru" },
            { "key": "az", "name": "Azerbaijani", "nativeName": "azərbaycan dili" },
            { "key": "bm", "name": "Bambara", "nativeName": "bamanankan" },
            { "key": "ba", "name": "Bashkir", "nativeName": "башҡорт теле" },
            { "key": "eu", "name": "Basque", "nativeName": "euskara, euskera" },
            { "key": "be", "name": "Belarusian", "nativeName": "Беларуская" },
            { "key": "bn", "name": "Bengali", "nativeName": "বাংলা" },
            { "key": "bh", "name": "Bihari", "nativeName": "भोजपुरी" },
            { "key": "bi", "name": "Bislama", "nativeName": "Bislama" },
            { "key": "bs", "name": "Bosnian", "nativeName": "bosanski jezik" },
            { "key": "br", "name": "Breton", "nativeName": "brezhoneg" },
            { "key": "bg", "name": "Bulgarian", "nativeName": "български език" },
            { "key": "my", "name": "Burmese", "nativeName": "ဗမာစာ" },
            { "key": "ca", "name": "Catalan; Valencian", "nativeName": "Català" },
            { "key": "ch", "name": "Chamorro", "nativeName": "Chamoru" },
            { "key": "ce", "name": "Chechen", "nativeName": "нохчийн мотт" },
            { "key": "ny", "name": "Chichewa; Chewa; Nyanja", "nativeName": "chiCheŵa, chinyanja" },
            { "key": "zh", "name": "Chinese", "nativeName": "中文 (Zhōngwén), 汉语, 漢語" },
            { "key": "cv", "name": "Chuvash", "nativeName": "чӑваш чӗлхи" },
            { "key": "kw", "name": "Cornish", "nativeName": "Kernewek" },
            { "key": "co", "name": "Corsican", "nativeName": "corsu, lingua corsa" },
            { "key": "cr", "name": "Cree", "nativeName": "ᓀᐦᐃᔭᐍᐏᐣ" },
            { "key": "hr", "name": "Croatian", "nativeName": "hrvatski" },
            { "key": "cs", "name": "Czech", "nativeName": "česky, čeština" },
            { "key": "da", "name": "Danish", "nativeName": "dansk" },
            { "key": "dv", "name": "Divehi; Dhivehi; Maldivian;", "nativeName": "ދިވެހި" },
            { "key": "nl", "name": "Dutch", "nativeName": "Nederlands, Vlaams" },
            { "key": "en", "name": "English", "nativeName": "English" },
            { "key": "eo", "name": "Esperanto", "nativeName": "Esperanto" },
            { "key": "et", "name": "Estonian", "nativeName": "eesti, eesti keel" },
            { "key": "ee", "name": "Ewe", "nativeName": "Eʋegbe" },
            { "key": "fo", "name": "Faroese", "nativeName": "føroyskt" },
            { "key": "fj", "name": "Fijian", "nativeName": "vosa Vakaviti" },
            { "key": "fi", "name": "Finnish", "nativeName": "suomi, suomen kieli" },
            { "key": "fr", "name": "French", "nativeName": "français, langue française" },
            { "key": "ff", "name": "Fula; Fulah; Pulaar; Pular", "nativeName": "Fulfulde, Pulaar, Pular" },
            { "key": "gl", "name": "Galician", "nativeName": "Galego" },
            { "key": "ka", "name": "Georgian", "nativeName": "ქართული" },
            { "key": "de", "name": "German", "nativeName": "Deutsch" },
            { "key": "el", "name": "Greek, Modern", "nativeName": "Ελληνικά" },
            { "key": "gn", "name": "Guaraní", "nativeName": "Avañeẽ" },
            { "key": "gu", "name": "Gujarati", "nativeName": "ગુજરાતી" },
            { "key": "ht", "name": "Haitian; Haitian Creole", "nativeName": "Kreyòl ayisyen" },
            { "key": "ha", "name": "Hausa", "nativeName": "Hausa, هَوُسَ" },
            { "key": "he", "name": "Hebrew (modern)", "nativeName": "עברית" },
            { "key": "hz", "name": "Herero", "nativeName": "Otjiherero" },
            { "key": "hi", "name": "Hindi", "nativeName": "हिन्दी, हिंदी" },
            { "key": "ho", "name": "Hiri Motu", "nativeName": "Hiri Motu" },
            { "key": "hu", "name": "Hungarian", "nativeName": "Magyar" },
            { "key": "ia", "name": "Interlingua", "nativeName": "Interlingua" },
            { "key": "id", "name": "Indonesian", "nativeName": "Bahasa Indonesia" },
            { "key": "ie", "name": "Interlingue", "nativeName": "Originally called Occidental; then Interlingue after WWII" },
            { "key": "ga", "name": "Irish", "nativeName": "Gaeilge" },
            { "key": "ig", "name": "Igbo", "nativeName": "Asụsụ Igbo" },
            { "key": "ik", "name": "Inupiaq", "nativeName": "Iñupiaq, Iñupiatun" },
            { "key": "io", "name": "Ido", "nativeName": "Ido" },
            { "key": "is", "name": "Icelandic", "nativeName": "Íslenska" },
            { "key": "it", "name": "Italian", "nativeName": "Italiano" },
            { "key": "iu", "name": "Inuktitut", "nativeName": "ᐃᓄᒃᑎᑐᑦ" },
            { "key": "ja", "name": "Japanese", "nativeName": "日本語 (にほんご／にっぽんご)" },
            { "key": "jv", "name": "Javanese", "nativeName": "basa Jawa" },
            { "key": "kl", "name": "Kalaallisut, Greenlandic", "nativeName": "kalaallisut, kalaallit oqaasii" },
            { "key": "kn", "name": "Kannada", "nativeName": "ಕನ್ನಡ" },
            { "key": "kr", "name": "Kanuri", "nativeName": "Kanuri" },
            { "key": "ks", "name": "Kashmiri", "nativeName": "कश्मीरी, كشميري‎" },
            { "key": "kk", "name": "Kazakh", "nativeName": "Қазақ тілі" },
            { "key": "km", "name": "Khmer", "nativeName": "ភាសាខ្មែរ" },
            { "key": "ki", "name": "Kikuyu, Gikuyu", "nativeName": "Gĩkũyũ" },
            { "key": "rw", "name": "Kinyarwanda", "nativeName": "Ikinyarwanda" },
            { "key": "ky", "name": "Kirghiz, Kyrgyz", "nativeName": "кыргыз тили" },
            { "key": "kv", "name": "Komi", "nativeName": "коми кыв" },
            { "key": "kg", "name": "Kongo", "nativeName": "KiKongo" },
            { "key": "ko", "name": "Korean", "nativeName": "한국어 (韓國語), 조선말 (朝鮮語)" },
            { "key": "ku", "name": "Kurdish", "nativeName": "Kurdî, كوردی‎" },
            { "key": "kj", "name": "Kwanyama, Kuanyama", "nativeName": "Kuanyama" },
            { "key": "la", "name": "Latin", "nativeName": "latine, lingua latina" },
            { "key": "lb", "name": "Luxembourgish, Letzeburgesch", "nativeName": "Lëtzebuergesch" },
            { "key": "lg", "name": "Luganda", "nativeName": "Luganda" },
            { "key": "li", "name": "Limburgish, Limburgan, Limburger", "nativeName": "Limburgs" },
            { "key": "ln", "name": "Lingala", "nativeName": "Lingála" },
            { "key": "lo", "name": "Lao", "nativeName": "ພາສາລາວ" },
            { "key": "lt", "name": "Lithuanian", "nativeName": "lietuvių kalba" },
            { "key": "lu", "name": "Luba-Katanga", "nativeName": "" },
            { "key": "lv", "name": "Latvian", "nativeName": "latviešu valoda" },
            { "key": "gv", "name": "Manx", "nativeName": "Gaelg, Gailck" },
            { "key": "mk", "name": "Macedonian", "nativeName": "македонски јазик" },
            { "key": "mg", "name": "Malagasy", "nativeName": "Malagasy fiteny" },
            { "key": "ms", "name": "Malay", "nativeName": "bahasa Melayu, بهاس ملايو‎" },
            { "key": "ml", "name": "Malayalam", "nativeName": "മലയാളം" },
            { "key": "mt", "name": "Maltese", "nativeName": "Malti" },
            { "key": "mi", "name": "Māori", "nativeName": "te reo Māori" },
            { "key": "mr", "name": "Marathi (Marāṭhī)", "nativeName": "मराठी" },
            { "key": "mh", "name": "Marshallese", "nativeName": "Kajin M̧ajeļ" },
            { "key": "mn", "name": "Mongolian", "nativeName": "монгол" },
            { "key": "na", "name": "Nauru", "nativeName": "Ekakairũ Naoero" },
            { "key": "nv", "name": "Navajo, Navaho", "nativeName": "Diné bizaad, Dinékʼehǰí" },
            { "key": "nb", "name": "Norwegian Bokmål", "nativeName": "Norsk bokmål" },
            { "key": "nd", "name": "North Ndebele", "nativeName": "isiNdebele" },
            { "key": "ne", "name": "Nepali", "nativeName": "नेपाली" },
            { "key": "ng", "name": "Ndonga", "nativeName": "Owambo" },
            { "key": "nn", "name": "Norwegian Nynorsk", "nativeName": "Norsk nynorsk" },
            { "key": "no", "name": "Norwegian", "nativeName": "Norsk" },
            { "key": "ii", "name": "Nuosu", "nativeName": "ꆈꌠ꒿ Nuosuhxop" },
            { "key": "nr", "name": "South Ndebele", "nativeName": "isiNdebele" },
            { "key": "oc", "name": "Occitan", "nativeName": "Occitan" },
            { "key": "oj", "name": "Ojibwe, Ojibwa", "nativeName": "ᐊᓂᔑᓈᐯᒧᐎᓐ" },
            { "key": "cu", "name": "Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic", "nativeName": "ѩзыкъ словѣньскъ" },
            { "key": "om", "name": "Oromo", "nativeName": "Afaan Oromoo" },
            { "key": "or", "name": "Oriya", "nativeName": "ଓଡ଼ିଆ" },
            { "key": "os", "name": "Ossetian, Ossetic", "nativeName": "ирон æвзаг" },
            { "key": "pa", "name": "Panjabi, Punjabi", "nativeName": "ਪੰਜਾਬੀ, پنجابی‎" },
            { "key": "pi", "name": "Pāli", "nativeName": "पाऴि" },
            { "key": "fa", "name": "Persian", "nativeName": "فارسی" },
            { "key": "pl", "name": "Polish", "nativeName": "polski" },
            { "key": "ps", "name": "Pashto, Pushto", "nativeName": "پښتو" },
            { "key": "pt", "name": "Portuguese", "nativeName": "Português" },
            { "key": "qu", "name": "Quechua", "nativeName": "Runa Simi, Kichwa" },
            { "key": "rm", "name": "Romansh", "nativeName": "rumantsch grischun" },
            { "key": "rn", "name": "Kirundi", "nativeName": "kiRundi" },
            { "key": "ro", "name": "Romanian, Moldavian, Moldovan", "nativeName": "română" },
            { "key": "ru", "name": "Russian", "nativeName": "русский язык" },
            { "key": "sa", "name": "Sanskrit (Saṁskṛta)", "nativeName": "संस्कृतम्" },
            { "key": "sc", "name": "Sardinian", "nativeName": "sardu" },
            { "key": "sd", "name": "Sindhi", "nativeName": "सिन्धी, سنڌي، سندھی‎" },
            { "key": "se", "name": "Northern Sami", "nativeName": "Davvisámegiella" },
            { "key": "sm", "name": "Samoan", "nativeName": "gagana faa Samoa" },
            { "key": "sg", "name": "Sango", "nativeName": "yângâ tî sängö" },
            { "key": "sr", "name": "Serbian", "nativeName": "српски језик" },
            { "key": "gd", "name": "Scottish Gaelic; Gaelic", "nativeName": "Gàidhlig" },
            { "key": "sn", "name": "Shona", "nativeName": "chiShona" },
            { "key": "si", "name": "Sinhala, Sinhalese", "nativeName": "සිංහල" },
            { "key": "sk", "name": "Slovak", "nativeName": "slovenčina" },
            { "key": "sl", "name": "Slovene", "nativeName": "slovenščina" },
            { "key": "so", "name": "Somali", "nativeName": "Soomaaliga, af Soomaali" },
            { "key": "st", "name": "Southern Sotho", "nativeName": "Sesotho" },
            { "key": "es", "name": "Spanish; Castilian", "nativeName": "español, castellano" },
            { "key": "su", "name": "Sundanese", "nativeName": "Basa Sunda" },
            { "key": "sw", "name": "Swahili", "nativeName": "Kiswahili" },
            { "key": "ss", "name": "Swati", "nativeName": "SiSwati" },
            { "key": "sv", "name": "Swedish", "nativeName": "svenska" },
            { "key": "ta", "name": "Tamil", "nativeName": "தமிழ்" },
            { "key": "te", "name": "Telugu", "nativeName": "తెలుగు" },
            { "key": "tg", "name": "Tajik", "nativeName": "тоҷикӣ, toğikī, تاجیکی‎" },
            { "key": "th", "name": "Thai", "nativeName": "ไทย" },
            { "key": "ti", "name": "Tigrinya", "nativeName": "ትግርኛ" },
            { "key": "bo", "name": "Tibetan Standard, Tibetan, Central", "nativeName": "བོད་ཡིག" },
            { "key": "tk", "name": "Turkmen", "nativeName": "Türkmen, Түркмен" },
            { "key": "tl", "name": "Tagalog", "nativeName": "Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔" },
            { "key": "tn", "name": "Tswana", "nativeName": "Setswana" },
            { "key": "to", "name": "Tonga (Tonga Islands)", "nativeName": "faka Tonga" },
            { "key": "tr", "name": "Turkish", "nativeName": "Türkçe" },
            { "key": "ts", "name": "Tsonga", "nativeName": "Xitsonga" },
            { "key": "tt", "name": "Tatar", "nativeName": "татарча, tatarça, تاتارچا‎" },
            { "key": "tw", "name": "Twi", "nativeName": "Twi" },
            { "key": "ty", "name": "Tahitian", "nativeName": "Reo Tahiti" },
            { "key": "ug", "name": "Uighur, Uyghur", "nativeName": "Uyƣurqə, ئۇيغۇرچە‎" },
            { "key": "uk", "name": "Ukrainian", "nativeName": "українська" },
            { "key": "ur", "name": "Urdu", "nativeName": "اردو" },
            { "key": "uz", "name": "Uzbek", "nativeName": "zbek, Ўзбек, أۇزبېك‎" },
            { "key": "ve", "name": "Venda", "nativeName": "Tshivenḓa" },
            { "key": "vi", "name": "Vietnamese", "nativeName": "Tiếng Việt" },
            { "key": "vo", "name": "Volapük", "nativeName": "Volapük" },
            { "key": "wa", "name": "Walloon", "nativeName": "Walon" },
            { "key": "cy", "name": "Welsh", "nativeName": "Cymraeg" },
            { "key": "wo", "name": "Wolof", "nativeName": "Wollof" },
            { "key": "fy", "name": "Western Frisian", "nativeName": "Frysk" },
            { "key": "xh", "name": "Xhosa", "nativeName": "isiXhosa" },
            { "key": "yi", "name": "Yiddish", "nativeName": "ייִדיש" },
            { "key": "yo", "name": "Yoruba", "nativeName": "Yorùbá" },
            { "key": "za", "name": "Zhuang, Chuang", "nativeName": "Saɯ cueŋƅ, Saw cuengh" }
        ];

        //  Default Grid Options
        $scope.gridOptions = {
            defaultColDef: {
                sortable: true,
                filter: true,
            },
            columnDefs: [],
            rowData: [],
            rowSelection: "multiple",
            suppressRowClickSelection: true,
            onCellValueChanged: function (params) {
                const lang = params.colDef.field;
                const property = params.data.property;
                const oldValue = params.oldValue;
                const newValue = params.newValue;
                //  If cell was really updated
                if (oldValue !== newValue) {
                    datamodelModel.translations.update(lang, {
                        path: `${$scope.selectedCategory}.${$scope.selectedOption}.${property}`,
                        value: newValue
                    }).then(function (result) {
                        if (result.status === 200) {
                            Notification.success("Property Name updated in translation file!");
                        } else {
                            Notification.error("Property Name not updated in translation file!");
                        }
                    })
                }
            },
            // onVirtualRowRemoved: (params) => {
            //     console.log(params);
            // }
        }

        //  Languages Grid
        $scope.languagesGridOptions = {
            columnDefs: [
                {
                    headerName: "Language",
                    field: 'name',
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: {
                        values: $scope.listOfLanguages
                    },
                    editable: false
                }, {
                    headerName: "Active",
                    field: "active",
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: {
                        values: ['true', 'false']
                    },
                    editable: true
                }, {
                    headerName: "Fallback Language",
                    field: "fallbackLanguage",
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: {
                        values: ['true', 'false']
                    },
                    editable: true
                }, {
                    headerName: "Preferred Language",
                    field: "preferredLanguage",
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: {
                        values: ['true', 'false']
                    },
                    editable: true
                }
            ],
            rowData: [],
            rowSelection: "single",
            domLayout: 'autoHeight',
            onCellValueChanged: function (params) {
                const lang = params.data.key;
                let langRow = params.data;
                //  Update String Selections to booleans
                if (langRow.active === "true" || langRow.active === true) {
                    langRow.active = true
                } else {
                    langRow.active = false
                }
                if (langRow.fallbackLanguage === "true" || langRow.fallbackLanguage === true) {
                    langRow.fallbackLanguage = true
                } else {
                    langRow.fallbackLanguage = false
                }
                if (langRow.preferredLanguage === "true" || langRow.preferredLanguage === true) {
                    langRow.preferredLanguage = true
                } else {
                    langRow.preferredLanguage = false
                }
                datamodelModel.translations.updateConfigLanguages({ remove: false, language: langRow }).then(function (result) {
                    if (result.status === 200) {
                        $scope.languages = result.data;
                        $scope.languagesGridOptions.api.setRowData($scope.languages);
                        Notification.success("Language updated");
                    } else {
                        Notification.error("Language NOT updated");
                    }
                });
            }
        }

        //  Get Setup Languages
        datamodelModel.translations.getLanguages().then(function (result) {
            if (result.status === 200) {
                $scope.languages = result.data;
                $scope.languagesGridOptions.api.setRowData($scope.languages);
                //  Get Translation Files
                $scope.languages.map(lang => datamodelModel.translations.get(lang.key).then(function (result) {
                    if (result.status === 200) {
                        $scope.translations[lang.key] = result.data;
                        if (lang.key === 'default') {
                            $scope.categories = Object.keys($scope.translations[lang.key]);
                        }
                    } else {

                    }
                }))
            } else {
                $scope.languages = [];
            }
        })

        $scope.renderAgGrid = () => {
            if ($scope.selectedCategory && $scope.selectedOption) {
                let columnDefs = [{
                    headerName: "Property",
                    field: "property",
                    editable: false,
                    sort: 'asc',
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    headerCheckboxSelectionFilteredOnly: true,
                }];
                $scope.languages.map(lang => columnDefs.push({
                    headerName: lang.name,
                    field: lang.key,
                    editable: true
                }));
                let rowData = [];
                if ($scope.translations['default'][$scope.selectedCategory] === undefined) {
                    $scope.translations['default'][$scope.selectedCategory] = {}
                }
                if ($scope.translations['default'][$scope.selectedCategory][$scope.selectedOption] === undefined) {
                    $scope.translations['default'][$scope.selectedCategory][$scope.selectedOption] = {}
                }
                Object.keys($scope.translations['default'][$scope.selectedCategory][$scope.selectedOption]).map(property => rowData.push({
                    property: property
                }))
                Object.keys($scope.translations).map(lang => {
                    if ($scope.translations[lang][$scope.selectedCategory] === undefined) {
                        $scope.translations[lang][$scope.selectedCategory] = {}
                    }
                    if ($scope.translations[lang][$scope.selectedCategory][$scope.selectedOption] === undefined) {
                        $scope.translations[lang][$scope.selectedCategory][$scope.selectedOption] = {}
                    }
                    let object = $scope.translations[lang][$scope.selectedCategory][$scope.selectedOption];
                    if (object) {
                        Object.keys(object).map(prop => {
                            let propIndex = rowData.findIndex(item => item.property === prop);
                            if (propIndex > -1) {
                                rowData[propIndex][lang] = object[prop];
                            }
                        })
                    } else {
                        console.log(`${$scope.selectedCategory}.${$scope.selectedOption} not found in ${lang}`);
                    }
                })
                $scope.gridOptions.api.setColumnDefs(columnDefs);
                $scope.gridOptions.api.setRowData(rowData);
            }
        }

        $scope.addRow = async () => {
            await Swal.fire({
                title: 'Please enter property name',
                input: 'text',
                showCancelButton: true,
                inputValidator: (property) => {
                    if (!property) {
                        return 'You need to write something'
                    } else {
                        $scope.gridOptions.api.updateRowData({ add: [{ property }] });
                    }
                }
            })
        }

        $scope.deleteRows = async () => {
            const selectedData = $scope.gridOptions.api.getSelectedRows();
            if (selectedData.length) {
                const properties = selectedData.map(i => `${$scope.selectedCategory}.${$scope.selectedOption}.${i.property}`);
                const result = await datamodelModel.translations.removeProps(properties);
                if (result.status === 200) {
                    $scope.gridOptions.api.updateRowData({remove: selectedData});
                } else {
                    Notification.error('Rows Not Deleted');
                }
            }
        };

        $scope.addLanguage = async () => {
            const existingLanguagesKeys = $scope.languages.map(item => item.key);
            let inputOptions = {};
            $scope.listOfLanguages.map(item => {
                if (!existingLanguagesKeys.includes(item.key)) {
                    inputOptions[item.key] = item.name;
                }
            });
            await Swal.fire({
                title: "Select a language to add",
                input: 'select',
                inputOptions,
                showCancelButton: true,
                inputValidator: (result) => {
                    if (!result) {
                        return 'You need to write something'
                    } else {
                        const selectedLang = $scope.listOfLanguages.find(item => item.key === result);
                        const langRow = {
                            key: selectedLang.key,
                            name: selectedLang.name,
                            fallbackLanguage: false,
                            preferredLanguage: false,
                            active: false
                        };
                        datamodelModel.translations.updateConfigLanguages({ remove: false, language: langRow }).then(function (result) {
                            if (result.status === 200) {
                                Notification.success("Language Added");
                                $scope.languages = result.data;
                                $scope.languagesGridOptions.api.setRowData($scope.languages);

                                let columnDefs = [{
                                    headerName: "Property",
                                    field: "property",
                                    editable: false
                                }];
                                $scope.languages.map(lang => columnDefs.push({
                                    headerName: lang.name,
                                    field: lang.key,
                                    editable: true
                                }));
                                $scope.gridOptions.api.setColumnDefs(columnDefs);
                            } else {
                                Notification.error("Language NOT Added");
                            }
                        })
                    }
                }
            })
        }

        $scope.removeLanguage = async() => {
            const inputOptions = {};
            $scope.languages.forEach(({key, name}) => inputOptions[key] = name);
            await Swal.fire({
                title: "Select a language to remove",
                input: 'select',
                inputOptions,
                showCancelButton: true,
                inputValidator: (result) => {
                    if (!result) {
                        return 'You need to select something'
                    } else {
                        const langRow = $scope.languages.find(item => item.key === result);
                        datamodelModel.translations.updateConfigLanguages({ remove: true, language: langRow }).then(function (result) {
                            if (result.status === 200) {
                                Notification.success("Language Removed");
                                $scope.languages = result.data;
                                $scope.languagesGridOptions.api.setRowData($scope.languages);

                                let columnDefs = [{
                                    headerName: "Property",
                                    field: "property",
                                    editable: false
                                }];
                                $scope.languages.map(lang => columnDefs.push({
                                    headerName: lang.name,
                                    field: lang.key,
                                    editable: true
                                }));
                                $scope.gridOptions.api.setColumnDefs(columnDefs);

                            } else {
                                Notification.error("Language NOT Removed");
                            }
                        })
                    }
                }
            })
        }

        $scope.getCategoryOptions = () => {
            $scope.gridOptions.api.setColumnDefs([]);
            $scope.gridOptions.api.setRowData([]);
            $scope.options = Object.keys($scope.translations['default'][$scope.selectedCategory]);
        }

        $scope.resetTranslations = () => {
            datamodelModel.getDatamodel()
                .catch(function (e) {
                    console.log(e)
                })
                .then(function (result) {
                    defaultLang = $scope.translations['default']
                    defaultLang.nodetype = {}
                    const nodetypes = result.nodetypes.filter(item => item.elementType === "node")
                    //  For each nodetype, add nodetype in language file if not exists and update its properties
                    nodetypes.map(nodetype => {
                        if (defaultLang.nodetype[nodetype.name] === undefined) {
                            defaultLang.nodetype[nodetype.name] = {}
                        }
                        nodetype.properties.map(property => {
                            defaultLang.nodetype[nodetype.name][property.name] = property.name
                        })
                    })
                    const relationships = result.nodetypes.filter(item => item.elementType === "relationship")
                    relationships.map(relationship => {
                        if (defaultLang.nodetype[relationship.name] === undefined) {
                            defaultLang.nodetype[relationship.name] = {}
                        }
                        relationship.properties.map(property => {
                            defaultLang.nodetype[relationship.name][property.name] = property.name
                        })
                    })
                    datamodelModel.translations.updateWhole('default', {
                        value: defaultLang
                    }).then(function (result) {
                        if (result.status === 200) {
                            $scope.translations['default'] = result.data.value
                            Notification.success("Default Language File Updated");
                        } else {
                            Notification.error("Default Language File NOT Updated");
                        }
                    })
                })
        }

        $scope.resetTranslationForCoreProperties = () => {
            datamodelModel.translations.resetTranslationForCoreProperties()
                .then((result) => {
                    if (result.status === 200) {
                        $scope.translations['default'] = result.data;
                        Notification.success("Default Language File Updated");
                    } else {
                        Notification.error("Error: Default Language File NOT Updated");
                    }
                })
                .catch((error) => {
                    console.error(error);
                    Notification.error("Error: Default Language File NOT Updated");
                });
        }
    })