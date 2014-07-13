/* 
Javascript code used by the main pages of IMT application (login not required) 
Last update: Michael @Osaka 2013-05-23 languages list ordered
*/

$(document).ready(function(){
	
	//Object used to switch language
	var data=[];
	for(var index in languages){
		data.push({
			code: index,
			text: languages[index].text
		});
	}
	$('#language-switcher').switcher({
		width:150,
		height:'auto',
		initialText: 'Language',
		data: data
	});
	
		
	
	//Inserts WP RSS feeds on home and help pgs
	var feedLang = ("0"+acr).slice(-2);
	$("#helpFeed").wordpressRSS({
		feedURL:"data/help.js",//http://brastelremitfaq"+feedLang+".wordpress.com/feed/",
		onlyTheseCategories:["FAQ"]
	});
	$("#msgFeed").wordpressRSS({
		feedURL:"data/message_board.js",//"http://brastelremit"+feedLang+".wordpress.com/feed/",
		categoryOpen:"&#171;",
		categoryClose:"&#187;"
	});
	


});//.ready()


function switchLanguage(index){
//Called by swicher.js to change UI language.
	var url1=getSwitchLanguageURL(index);
	self.location.href=url1;
}

function getSwitchLanguageURL(index){
//When a new language has been selected, return the URL where to redirect the user 	
	var url0=self.location.href;
	var path0=self.location.pathname;//for example: "/eng/home" or "home"

	var newAcrParam=languages[index].acr;
	var newLangParam=languages[index].lang;
	
	//if the current URL is language + alias, (for example brastelremit.jp/eng/fees), replace the lang parameter
	if (url0.indexOf("/"+lang+"/")>-1){
		var re1=new RegExp("/"+lang+"/","g")
		return url0.replace(re1,"/"+newLangParam+"/")
	}
	
	//if the current URL is a single alias, like brastelremit.jp/home, insert the "lang" parameter
	var re2=new RegExp("/.*/.*");
	if(!re2.test(path0)){
		return "/"+newLangParam+path0;
	}
	
	//By default, add (or update) the acr parameter of the URL
	var o=new URLManager(url0);
	o.setParameter("acr",newAcrParam);
	return o.toString();
	
}

/*
URLManager Class
used to add/remove parameters in URL
Michael@Osaka 2011-11-2011

Examples :
var url=new URLManager("http://192.168.2.20/home")
url.setParameter("acr",2);
url.setParameter("key1","value1").toString();
*/

var URLManager=function(url){
	
	this.url=(url) ? url : self.location.href;//Full URL : can be passed to the constructor, the current URL, otherwise
	this.queryString="";//QueryString part oof the URL (after the ?)
	this.urlPart1=this.url;//First part oof the URL (after the ?)
	
	this.params=[];//Array of the parameter names 
	this.map=[];//Map (associative array) of the parameter values

	
	var index=this.url.indexOf("?");
	if(index>-1){
		this.queryString=this.url.substring(index+1,this.url.length);
		this.urlPart1=this.url.substring(0,index);
		var arr1=(this.queryString).split("&");
		for(var i=0;i<arr1.length;i++){
			var arr2=arr1[i].split("=");
			var key=arr2[0];
			var value=(arr2.length==2) ? arr2[1] : "";
			this.map[key]=value;
			this.params.push(key);
		}
	}
	
	this.setParameter=function(key,value){
		//Set a parameter value and returns the object itself (useful to chain calls)
		if(!this.map[key]){
			this.params.push(key);
		}

		this.map[key]=value.toString();
		this.update();
		return this;
	}
	
	this.getParameter=function(key){
		var x=(this.map[key]) ? this.map[key] : "";
		return x
	}
	
	this.update=function(){
		//Update URL and QueryString attributes when the parameters have changed.
		var x="";
		for(var i=0;i<this.params.length;i++){
			key=this.params[i];
			value=this.map[key];
			if(x!="") x=x+"&";
			x=x+key;
			if(value!="") x=x+"="+value;
		}
		var newURL=this.urlPart1
		if(x!="") newURL=newURL+"?"+x;
		
		this.queryString=x;
		this.url=newURL;
	}
	
	this.toString=function(){
		return this.url;
	}
	
}
/*
End of URLManager Class
*/


/*
CSS Browser Selector v0.4.0 (Nov 02, 2010)
Rafael Lima (http://rafael.adm.br)
http://rafael.adm.br/css_browser_selector
License: http://creativecommons.org/licenses/by/2.5/
Contributors: http://rafael.adm.br/css_browser_selector#contributors

Note (by Yujiro 2011/03/23):
I edited a bit the original script so that the class is added to the body tag instead of the html tag.
jQuery is required for this to work now.

*/

function css_browser_selector(u){var ua=u.toLowerCase(),is=function(t){return ua.indexOf(t)>-1},g='gecko',w='webkit',s='safari',o='opera',m='mobile',h=document.documentElement,b=[(!(/opera|webtv/i.test(ua))&&/msie\s(\d)/.test(ua))?('ie ie'+RegExp.$1):is('firefox/2')?g+' ff2':is('firefox/3.5')?g+' ff3 ff3_5':is('firefox/3.6')?g+' ff3 ff3_6':is('firefox/3')?g+' ff3':is('gecko/')?g:is('opera')?o+(/version\/(\d+)/.test(ua)?' '+o+RegExp.$1:(/opera(\s|\/)(\d+)/.test(ua)?' '+o+RegExp.$2:'')):is('konqueror')?'konqueror':is('blackberry')?m+' blackberry':is('android')?m+' android':is('chrome')?w+' chrome':is('iron')?w+' iron':is('applewebkit/')?w+' '+s+(/version\/(\d+)/.test(ua)?' '+s+RegExp.$1:''):is('mozilla/')?g:'',is('j2me')?m+' j2me':is('iphone')?m+' iphone':is('ipod')?m+' ipod':is('ipad')?m+' ipad':is('mac')?'mac':is('darwin')?'mac':is('webtv')?'webtv':is('win')?'win'+(is('windows nt 6.0')?' vista':''):is('freebsd')?'freebsd':(is('x11')||is('linux'))?'linux':'','js']; c = b.join(' '); return c;}; css_browser_selector(navigator.userAgent);

$(document).ready(function(){
	$("body").addClass(c);
});

/***********
wordpressRSS plugin
Reads RSS feeds form Wordpress
Used for home page message board and help pages.

Options and their defaults:
	feedURL:"", // (Required) Wordpress blog feed URL
	onlyTheseCategories: [], // Enter in an array the post categories you want to show. For the help (FAQ) page, just enter "FAQ"
	allExceptTheseCategories: [], // Enter in an array the post categories you want to hide. onlyTheseCategories has preference
	showCategoryInTitle:true, // If true and if category is not FAQ, will insert the category name before the post title. 
	categoryOpen:"&lt;", // text that wraps the category, e.g. <News>, default "<"
	categoryClose:"&gt;" // text that wraps the category, default ">"
	
Example:
	$("#helpFeed").wordpressRSS({
		feedURL:"http://brastelremitfaq04.wordpress.com/feed/",
		onlyTheseCategories:["FAQ"]
	});

************/
(function($){
	$.fn.extend({ 
		wordpressRSS: function(options)
		{
			var defaults = {
				feedURL:"",
				onlyTheseCategories: [],
				allExceptTheseCategories: [],
				showCategoryInTitle:true,
				categoryOpen:"&lt;",
				categoryClose:"&gt;"
			};
			var options = $.extend(defaults, options);
			return this.each(function() {
				var o =options;
				var obj = $(this);
				if (o.feedURL=="") {return false;}
				else
				{
					obj.html("");
					$('<img class="loading" alt="loading..." src="'+imgRoot+'/external/loading.gif" />').appendTo(obj).load(function(){
						$.ajax({
							type: "GET",
							url: o.feedURL,//wimsURL,
							data:
								({
									/*xslFile: "feed_reader.xsl",
									action : "ReadExternalXML",
									URL    : o.feedURL*/
								}),
							success: function (res)
							{
								data = eval('(' + res + ')');
								feeds = data.feed;
								var table=$("<table>").appendTo(obj);
								$.each(feeds,function(index,feed){
									if (testCtgy(feed.ctgy))
									{
										
										var feedDiv = $('<tr class="feed" />').attr("id",obj.attr("id")+index).addClass(feed.ctgy);
										$('<td class="index clickable" />').appendTo(feedDiv);
										var pubDate = new Date(feed.pubDate);
										var pubYear = pubDate.getFullYear();
										var pubMonth = ("0"+(pubDate.getMonth()+1)).slice(-2);
										var pubDay= ("0"+pubDate.getDate()).slice(-2);
										$('<td class="pubDate clickable" />').html(pubYear+"/"+pubMonth+"/"+pubDay).appendTo(feedDiv);
										var ctgy = o.showCategoryInTitle ? $('<span />').addClass(feed.ctgy+" ctgy").html(o.categoryOpen+feed.ctgy+o.categoryClose) : "";
										var titleText = $('<span class="txt" />').html(feed.title);
										var titleLink = $('<span class="title clickable" />').append(ctgy).append(titleText);
										var title = $('<td class="title" />').append(titleLink).appendTo(feedDiv);
										
										var contHtml = feed.content.replace(/<br \/>\s+<a rel=\"nofollow\".*/,"");
										$('<div class="content" style="display:none;" />').html(contHtml).appendTo(title);
										feedDiv.appendTo(table);
									}
								})
								obj.find(".loading").fadeOut();
								if (o.onlyTheseCategories[0]=="FAQ")
								{
									obj.find("td.pubDate").hide();
									obj.find("span.ctgy").hide();
									$.each(obj.find("tr.feed"),function(index){
										var qNum = index+1;
										$(this).find("td.index").html(qNum+".")
									})
								}
								else obj.find("td.index").hide();
								obj.find(".clickable").bind("click",function(){
																					  
									obj.find("tr.selected").removeClass("selected");//Remove the class from the line that was selected previously	
									var tr=$(this).parents("tr");
									var title = tr.find(".title");
									var contVisible = $(".content:visible");
									contVisible.slideUp(200);
									var content = title.nextAll(".content")
									if (content.is(":visible")){
										content.slideUp(200);
									}
									else{
										content.slideDown(200);
										tr.addClass("selected");										
									}
									return false
								});
							}
						});
					});
				}
				function testCtgy(ctgy){
					if (o.onlyTheseCategories[0]=="FAQ") return true;
					else if (o.onlyTheseCategories.length==0 && o.allExceptTheseCategories.length==0) return true;
					else if (o.onlyTheseCategories.length>0)
					{
						var _match = false
						$.each(o.onlyTheseCategories,function(index,value){
							if ( value==ctgy )
							{
								_match=true;
								return false;
							}
						});
						return _match;
					}
					else if (o.allExceptTheseCategories.length>0)
					{
						var _match = true
						$.each(o.allExceptTheseCategories,function(index,value){
							if ( value==ctgy )
							{
								_match=false;
								return false;
							}
						});
						return _match;
					}
					else return false
				}
			});
		}
	});
})(jQuery);