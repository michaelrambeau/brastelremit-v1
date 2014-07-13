/*
Script used by both registration step 1 page and first login page (for temporary users)
We use ajax request to load "legal information" pages and  update 6 HTML blocks
Last update Michael@Osaka 2012/05/11
*/

function loadLegalInformation(){
//Load by ajax the 6 "legal information pages" and update HTML blocks.
	loadFile("footer_terms_conditions.xsl&action=GetRemittanceRules",$('#block-terms'));						   
						   
	loadFile("footer_antisocial_forces_statement.xsl",$('#block-statement-antisocial'));
	
	loadFile("footer_privacy_policy.xsl",$('#block-privacy-policy'));						   
	
	loadFile("footer_declaration_antisocial_forces.xsl",$('#block-declaration-antisocial'));	
	
	loadFile("footer_electronic_delivery.xsl",$('#block-electronic-delivery'));	
	
	loadFile("footer_sanction_regulations.xsl",$('#block-sanction-regulations'));	
}

function loadFile(xslFile,block){
//Calls "legal information document" page and update the given HTML block.

	block.append($('<div class="loading"><img src="'+imgRoot+'/external/loading.gif" alt="loading..."/></div>'));
	
	var url=wimsURL+"&acr="+acr+"&xslFile=	"+xslFile;
	
	block.load(url+' .legal-document', function(text) {
  		if(window.console) console.log(xslFile+ " has been loaded.");
		block.linkify();
	});

}

/*

Linkify plugin, used to convert terms and conditons page URLs to links.

*/
(function($) {
  function replaceSubstitutions(str, array) {

    for (var i = 0; i < array.length; i++) {
      str = str.replace('{' + i + '}', array[i]);
    }

    return str;
  }


  $.fn.linkify = function() {

    function _linkify(s) {

      var re = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/im;
      var match, replacements = [],i = 0;
      while (match = re.exec(s)) {
        replacements.push('<a href="' + match[0] + '" target="_new">' + match[0] + '</a>');
        s = s.replace(re, '{' + i + '}');
        i++;
      }

      return i > 0 ? replaceSubstitutions(s, replacements) : s;
    }

	$(this).each(function(index,element){
		var node=$(element)	;			
		var html=_linkify(node.html());
		node.html(html);
	})

    return this;
  };//linkify plugin


})(jQuery);
