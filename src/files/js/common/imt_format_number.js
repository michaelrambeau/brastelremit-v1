/*
Functions used to format yens amounts
Michael @Osaka 2011-12-08
*/


function stringToInteger(value){
//Convert a String to an integer
	return (! isNaN(value)) ? parseInt(value) : 0;
}
function stringToFloat(value){
//Convert a String value to a float number
	return (! isNaN(value)) ? parseFloat(value) : 0;
}

function roundNbDecimal(value,nb){
//Reound a numeric value using the given number of decimals	
    var i=Math.pow(10,nb)
    var x=value * i;
    return Math.round(x)/i;
}

function formatYen(value,displayCurrencySymbol,textOnly){
//From an amount of yens, returns a String value (with thousands separator)
//if displayCurrencySymbol is set to True, the yen symbol is added (before or after the amount)
	var integerPart=Math.floor(Math.abs(value));
	var decimalPart=Math.abs(value) - integerPart;
	var stringValue=value.toString()
	var stringDecimalPart=(decimalPart>0) ? stringValue.substr(stringValue.indexOf(".")) : "";
	//var int = parseInt(value);
	//var absValue=Math.abs(int)
	
	var strInt = addCommaSeparator(integerPart.toString());
	var result=strInt+stringDecimalPart;
	
	if(!textOnly) result='<span class="yen-numbers">'+result+'</span>';
	if(displayCurrencySymbol) result=addYenSymbol(result,textOnly);
	if(!textOnly) result='<span class="yen-amount">'+result+'</span>';
	if(value<0){
		result="-&nbsp;"+result;
	}
	return result
}

function addCommaSeparator(_string){
	var rgx = /(\d+)(\d{3})/;
	var separator=(acr==1) ? "." : ",";
	while (rgx.test(_string)) {
	_string = _string.replace(rgx, '$1' + separator + '$2');
	}
	return _string;
} 

function addYenSymbol(strAmount,textOnly){
//Add the yen symbol, after or before a String reprensenting an amount of yen
//used by formatYen(value,symbol) method if second paraneter equals true
	var symbol=(acr=="3") ? "&nbsp;&#20870;" :"&yen;";//yen kanji is used in Japanese (acr="3")
	if(!textOnly) symbol='<span class="yen-symbol">'+symbol+'</span>'
	var result=(acr=="3") ? strAmount+symbol : symbol+strAmount;
	return result;
} 
