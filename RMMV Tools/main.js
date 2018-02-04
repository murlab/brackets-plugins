//=============================================================================
// RMMV Tools v1.0
// Copyright (c) 2018 MUR (https://github.com/murlab)
// BSD 3-Clause "New" or "Revised" License
// Free for use with both free and commercial
//=============================================================================

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global define, require, brackets, $, Mustache, chosenTemplate */

require.config({
	paths: {
		"text" : "lib/text",
		"i18n" : "lib/i18n"
	},
	locale: brackets.getLocale()
});

define(function (require, exports, module) {
	"use strict";

	var Strings			= require('strings');
	var modal_new		= require('text!modals/new_plugin.html');
	var modal_settings	= require('text!modals/settings.html');
	var template		= require('text!templates/new_plugin.js');
	var template_params	= require('text!templates/params_plugin.js');

	var CommandManager	= brackets.getModule("command/CommandManager"),
		Menus			= brackets.getModule("command/Menus"),
		// EditorManager	= brackets.getModule('editor/EditorManager'),
		DocumentManager = brackets.getModule('document/DocumentManager'),
		// DocumentCommandHandlers = brackets.getModule('document/DocumentCommandHandlers'),
		MainViewManager	= brackets.getModule('view/MainViewManager'),
		_ 				= brackets.getModule('thirdparty/lodash'),
		DocumentModule 	= brackets.getModule('document/Document'),
		FileSystem 		= brackets.getModule('filesystem/FileSystem'),
		InMemoryFile	= brackets.getModule('document/InMemoryFile'),
		Dialogs			= brackets.getModule('widgets/Dialogs');

	var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		prefs = PreferencesManager.getExtensionPrefs("myextensionname");

	prefs.definePreference("author", "string", "Anonymous");
	prefs.definePreference("url", "string", "http://");
	prefs.definePreference("lastLicense", "string", "");
	prefs.definePreference("lastFree", "string", "");
	prefs.definePreference("lastLangType", "string", "independent");
	prefs.definePreference("lastLangEn", "boolean", true);
	prefs.definePreference("lastLangRu", "boolean", true);

	function newPluginDoc(pName, pLicense, pFree, pHelp, pLangType, pLangEn, pLangRu) {

		var _untitledDocumentPath = "/_brackets_" + _.random(10000000, 99999999);

		var filename = prefs.get("author") + "_" + pName + ".js",
			fullPath = _untitledDocumentPath + "/" + filename,
			now = new Date(),
			file = new InMemoryFile(fullPath, FileSystem);

		FileSystem.addEntryForPathIfRequired(file, fullPath);

		var doc = new DocumentModule.Document(file, now, "");

		var pParams = "";
		if (pLangType == "together") {
			pParams += getLangParams("", pName, pHelp);
		} else {
			if (pLangEn) {
				pParams += getLangParams("en", pName, pHelp);
			}
			if (pLangRu) {
				pParams += getLangParams("ru", pName, pHelp);
			}
		}

		var docContent = template;
		docContent = docContent.replace (/%AUTHOR%/g, prefs.get("author"));
		docContent = docContent.replace (/%PLUGIN_NAME%/g, pName);
		docContent = docContent.replace (/%URL%/g, prefs.get("url"));
		docContent = docContent.replace (/%LICENSE%/g, pLicense);
		docContent = docContent.replace (/%FREE%/g, pFree);
		docContent = docContent.replace (/%HELP%/g, pHelp);
		docContent = docContent.replace (/%FILENAME%/g, filename);
		docContent = docContent.replace (/%PLUGIN_PARAMS%/g, pParams);
		docContent = docContent.replace (/%YEAR%/g, (new Date).getFullYear());

		doc.setText(docContent);

		MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);

		prefs.set("lastLicense", pLicense);
		prefs.set("lastFree", pFree);
		prefs.set("lastLangType", pLangType);
		prefs.set("lastLangEn", pLangEn);
		prefs.set("lastLangRu", pLangRu);
		prefs.save();
	}

	function getLangParams(pLang, pName, pHelp) {
		var newParam = template_params;
		newParam = newParam.replace (/%PLUGIN_LANG%/g, pLang);
		newParam = newParam.replace (/%PLUGIN_NAME%/g, pName);
		newParam = newParam.replace (/%AUTHOR%/g, prefs.get("author"));
		newParam = newParam.replace (/%HELP%/g, pHelp);
		return newParam;
	}

	function storeSettings(newAuthor, newURL) {
		prefs.set("author", newAuthor);
		prefs.set("url", newURL);
		prefs.save();
	}

	function showSettingsWindow() {
		Dialogs.showModalDialogUsingTemplate(Mustache.render(modal_settings, Strings));
		
		$('#rmmv_tools_modal_settings #rmmv_tools_inputAuthor').val(prefs.get("author"));
		$('#rmmv_tools_modal_settings #rmmv_tools_inputUrl').val(prefs.get("url"));

		$('#rmmv_tools_modal_settings #rmmv_tools_btnOk').on('click', function () {
			storeSettings(
				$('#rmmv_tools_modal_settings #rmmv_tools_inputAuthor').val(),
				$('#rmmv_tools_modal_settings #rmmv_tools_inputUrl').val()
			);
		});
	}

	function checkLangType() {
		if($('#rmmv_tools_modal_new input[name=rmmv_tools_lang_type]:checked').val() == "independent") {
			$('#rmmv_tools_modal_new #rmmv_tools_inputLang_en').removeAttr('disabled');
			$('#rmmv_tools_modal_new #rmmv_tools_inputLang_ru').removeAttr('disabled');
			$('#rmmv_tools_modal_new #rmmv_tools_inputLangs').css('opacity', '1.0');
		} else {
			$('#rmmv_tools_modal_new #rmmv_tools_inputLang_en').attr('disabled', 'disabled');
			$('#rmmv_tools_modal_new #rmmv_tools_inputLang_ru').attr('disabled', 'disabled');
			$('#rmmv_tools_modal_new #rmmv_tools_inputLangs').css('opacity', '0.3');
		}
	}

	function showNewPluginWindow() {	
		Dialogs.showModalDialogUsingTemplate(Mustache.render(modal_new, Strings));

		$('#rmmv_tools_modal_new select#rmmv_tools_license').val(prefs.get("lastLicense"));

		$('#rmmv_tools_modal_new input[name=rmmv_tools_free_use][value="' + prefs.get("lastFree") + '"]').attr('checked', 'checked');
		
		$('#rmmv_tools_modal_new input[name=rmmv_tools_lang_type][value="' + prefs.get("lastLangType") + '"]').attr('checked', 'checked');

		checkLangType();
		
		$('#rmmv_tools_modal_new #rmmv_tools_inputLang_en').prop('checked', prefs.get("lastLangEn"));
		$('#rmmv_tools_modal_new #rmmv_tools_inputLang_ru').prop('checked', prefs.get("lastLangRu"));

		$('#rmmv_tools_modal_new #rmmv_tools_inputName').on('change paste keyup', function () {
			if($(this).val() == "") {
				$('#rmmv_tools_modal_new #rmmv_tools_btnOk').attr('disabled', 'disabled');
			} else {
				$('#rmmv_tools_modal_new #rmmv_tools_btnOk').removeAttr('disabled');
			}
		});

		$('#rmmv_tools_modal_new input[name=rmmv_tools_lang_type]').on('click', function () {
			checkLangType();
		});

		$('#rmmv_tools_modal_new #rmmv_tools_btnOk').on('click', function () {
			newPluginDoc(
				$('#rmmv_tools_modal_new #rmmv_tools_inputName').val(),
				$('#rmmv_tools_modal_new #rmmv_tools_license').val(),
				$('#rmmv_tools_modal_new input[name=rmmv_tools_free_use]:checked').val(),
				$('#rmmv_tools_modal_new #rmmv_tools_help').val(),
				$('#rmmv_tools_modal_new input[name=rmmv_tools_lang_type]:checked').val(),
				$('#rmmv_tools_modal_new #rmmv_tools_inputLang_en').prop('checked'),
				$('#rmmv_tools_modal_new #rmmv_tools_inputLang_ru').prop('checked')
			);
		});
	}
	
	var NEW_PLUGIN_ID = "rmmv-tools.new_plugin";
	CommandManager.register(Strings.MENU_NEW_PLUGIN, NEW_PLUGIN_ID, showNewPluginWindow);

	var SETTINGS_ID = "rmmv-tools.settings";
	CommandManager.register(Strings.MENU_SETTINGS, SETTINGS_ID, showSettingsWindow);

	var menu = Menus.addMenu("RMMV Tools", "rmmv-tools");
	menu.addMenuItem(NEW_PLUGIN_ID, "Ctrl-Shift-N");
	menu.addMenuDivider();
	menu.addMenuItem(SETTINGS_ID);

});
