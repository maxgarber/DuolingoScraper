//	Duolingo Scraper
//	by Maxwell Garber <max.garber@gmail.com>
//	2017-05-02
//	version 1.9
//	user's note: for now this works as a snippet to run from Chrome's dev tools
//		working on getting a bookmarklet version that works as well

// globals
var baseURI = 'https://www.duolingo.com';
var language = $('span.skill-tree-header h1').text().split(' ')[0];
var skillURIs = [];
$.each($('a.skill-badge-small'), function(index, value) {
	skillURIs[index] = baseURI + $(value).attr('href');
});
var notes = [];
var body = $('body');
var styles = {};
var styleKeys = [];
//var limit = 3;				// -- use to only download a subset
var i = 0;
var captureStyles = false;		// -- using custom styling for now

var styling = "\
<style>                                                  \
	@font-face {                                         \
		font-family: museo-sans-rounded;                 \
		src: url('museosansrounded-300-webfont.woff2');  \
	}                                                    \
	body {                                               \
		position: absolute;                              \
		top: 2em;                                        \
		left: 2em;                                       \
		right: 2em;                                      \
		background-color: gray;                          \
		font-family: museo-sans-rounded, sans-serif;     \
		font-weight: light;                              \
		size: 0.75em;                                    \
	}                                                    \
	div.skill {                                          \
		border: 0.1em solid black;                       \
		padding-left: 2em;                               \
		padding-right: 2em;                              \
		padding-bottom: 1em;                             \
		background-color: white;                         \
	}                                                    \
	h1 {                                                 \
		border-bottom: 0.1em solid black;                \
	}                                                    \
	table {                                              \
		border-collapse: collapse;                       \
	}                                                    \
	th {                                                 \
		border: 0.1em solid black;                       \
		border-bottom: 0.2em solid black;                \
		background-color: #24A7E5;                       \
		padding-top: 0.2em;                              \
		padding-bottom: 0.2em;                           \
		padding-left: 0.5em;                             \
		padding-right: 0.5em;                            \
	}                                                    \
	td {                                                 \
		border: 0.1em solid black;                       \
		padding: 0.2em;                                  \
		padding-left: 0.5em;                             \
		padding-right: 0.5em;                            \
	}                                                    \
	hr {                                                 \
		display: none;                                   \
	}                                                    \
</style>                                                 \
\n";


// functions
var writeToFile = function () {
	var outputDocumentText = "<!DOCTYPE html>\n<html>\n";
	
	if (captureStyles) {
		var styleCSS = "<style>\n";
		for(i=0; i<styleKeys.length; i++) {
			var selector = styleKeys[i];
			var style = styles[selector];
			styleCSS += selector + " {\n" + style + "\n}\n\n";
		}
		styleCSS += "</style>\n";
		outputDocumentText += styleCSS;
	} else {
		outputDocumentText += styling;
	}

	var bodyHTML = "<body>\n";
	var prefix = "<div class='skill'>\n";
	var suffix = "</div>\n";
	for(i=0; i<skillURIs.length && i<limit; i++) {
		bodyHTML += prefix + "<h1 id='skill-" + notes[i].number +"'> Lesson " + notes[i].number +' - ' + notes[i].name + "</h1>\n";
		bodyHTML += notes[i].html + suffix;
	}
	bodyHTML += "</body>\n";
	outputDocumentText += bodyHTML + "</html>\n";

	// localStorage
	// window.localStorage.setItem("DuolingoScraping", outputDocumentText);

	var aBlob = new Blob([outputDocumentText], {type: 'text/html'});
	var aBlobURL = window.URL.createObjectURL(aBlob);
	var aBlobLink = document.createElement("a");
	document.body.appendChild(aBlobLink);
	aBlobLink.style = "display:none";
	aBlobLink.href = aBlobURL;
	aBlobLink.download = language + ' Grammar Notes.html';
	aBlobLink.target = "_blank";
	aBlobLink.click();

	var fontDownloadAnchor = document.createElement("a");
	fontDownloadAnchor.style = "display:none";
	fontDownloadAnchor.href = "https://d7mj4aqfscim2.cloudfront.net/proxy/fonts/museo/museosansrounded-300-webfont.woff2";
	fontDownloadAnchor.target = "_blank";
	fontDownloadAnchor.click();
	
	// known issue: WebKit/Safari will just open this in a new tab/window, the user will have to manually save
	
	cleanup();
}

var cleanup = function() {
	$('.portal').each( function (i,e,l) {
		$(e).remove();
	});
	
	baseURI = undefined;
	language = undefined;
	skillURIs = undefined;
	notes = undefined;
	body = undefined;
	styles = undefined;
	styleKeys = undefined;
	limit = undefined;
	i = undefined
	captureStyles = undefined;
	
	//console.clear();
};

var removeExtraneousText = function(content) {
	$(content).children().find('h2:contains("Tips and notes")').parent().children('p:contains("Grammar notes like those below can be helpful if you\'re having trouble with the lessons, so consider trying the lessons above before reading the notes. They\'ll be more helpful once you have a context for understanding them.")').remove();
	$(content).children().find('h2:contains("Tips and notes")').remove();
	$(content).children().find('div.tips-notes-panel > p > a[href="http://www.duolingo.com/DXLi"]').parent().remove();
};

var portalLoaded = function() {
	//	Preliminaries
	var skillURI = skillURIs[i];
	var portal = $('#portal-'+i);
	var portalWindow = $(portal).get(0).contentWindow;
	var portalContents = $(portal).contents();
	
	//	Grammar Notes Extraction
	var skillName = $(portalContents).children().find('h1').text();
	removeExtraneousText(portalContents);
	var skillNotesPanel = $(portalContents).children().find('div.tips-notes-panel');	
	var skillNotesHTML = skillNotesPanel.html();
	if ($(skillNotesHTML).get(0) == null || $(skillNotesHTML).get(0) == undefined) {
		skillNotesHTML = null;
	}
	
	//	Styling Extraction
	//	TODO: fix style extraction, add font grab
	if (captureStyles == true) {
		var skillNotesNode = skillNotesPanel.get(0);
		var skillNotesNodeName = skillNotesNode.nodeName;
		if( styles[skillNotesNodeName] == null || styles[skillNotesNodeName] == undefined ) {
			styles[skillNotesNodeName] = portalWindow.getComputedStyle(skillNotesNode).cssText;
			styleKeys[styleKeys.length] = nodeName;
		}
		var skillNotesDescendants = $("*", skillNotesPanel).addBack().contents();
		for(j=0; j<skillNotesDescendants.length; j++) {
			var descendant = skillNotesDescendants.eq(j);
			var descendantNode = descendant.get(0);
			var nodeName = descendantNode.nodeName;
			if (nodeName != "#text" && (styles[nodeName]==null || styles[nodeName]==undefined)) {
				styles[nodeName] = portalWindow.getComputedStyle(descendantNode).cssText;
				styleKeys[styleKeys.length] = nodeName;
			}
		}
	}
	
	//	Package & Add to Cache
	notes[i] = {
		name: skillName,
		number: i+1,
		url: skillURI,
		html: skillNotesHTML,
	};

	//	TODO: add vocabulary extraction
	
	//	carry on
	// console.clear();
	console.log('parsed skill '+notes[i].number+' of '+skillURIs.length+': '+notes[i].name);
	i++;
	
	iterationFunction();
};

var portalReady = function() {
	var portal = $('#portal-'+i);
	$(portal).load(portalLoaded);	
	portal.src = skillURIs[i];
	$(portal).get(0).contentWindow.location.assign(portal.src);
};

var iterationFunction = function() {
	if(i >= limit || i >= skillURIs.length) {
		$('.portal').remove();
		
		writeToFile();
		// console.clear();
		console.log("Finished scraping.");
		return;
	}
	
	$(body).append('<iframe class="portal" id="portal-'+i+'" hidden="true">');
	
var portalDocument = $('#portal-'+i).get(0).contentDocument;

	$(portalDocument).ready(portalReady);

};

// pseudo-main()
console.log("Started scraping…")
iterationFunction();

//end