/*
Functions used by the the form "Validator" jquery plug-in.
kanji table : http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
Last update : Michael @Osaka 2012-10-16 isJapaneseCharacter
*/

$(document).ready(function(){
    //translate function uses a global array called eText() that is initialized by the XSL code.
    jQuery.validator.messages.email=translate("I0001-0073-0001","Invalid email!");
	jQuery.validator.messages.required=translate("I0001-0073-0016","Required!");
    jQuery.validator.messages.digits=translate("I0001-0073-0002","Numbers only!");
    jQuery.validator.messages.equalTo=translate("I0001-0073-0015","Enter the same value!");
	
    addBrastelValidationMethods();
});


function isPhoneNumber(phoneNumber){
    //Returns true if the given string contains only digits, space, hyphens and parentesis, 6 digits at least.
    var x= phoneNumber.replace(/\s+/g, ""); 
    if (!(/^[\d \-\(\)]+$/).test(x)) return false;
    numbers=x.replace(/\s+ \-/g, "");
    if(numbers.length < 6) return false;
    return true;
}


function isJapanFixedPhoneNumber(phoneNumber){
    //Returns true if the given string is a Japan fixed phone number (0123456789 for example)
    if(! isPhoneNumber(phoneNumber)) return false;
    var x= phoneNumber.replace(/[^0-9]/g, "");
	
    //Must contain 10 numbers
    numbers=x.replace(/\s+ \-/g, "");
    if(numbers.length!=10) return false;
	
    //Must start with only one zero
    if (!(/^0[^0]\d+$/).test(numbers)) return false;
	
    return true;
}

function isJapanMobilePhoneNumber(phoneNumber){
    //Returns true if  the given string is a Japan mobile phone number	(07012345678 for example)
    if(! isPhoneNumber(phoneNumber)) return false;
    var x= phoneNumber.replace(/[^0-9]/g, "");
		
    //Must contain 10 numbers
    numbers=x.replace(/\s+ \-/g, "");
    if(numbers.length!=11) return false;
	
    //Must start with 070 ,080 or 090
    if (!(/^(070|080|090)\d+$/).test(numbers)) return false;
	
    return true;
}

function isJapanIPPhoneNumber(phoneNumber){
    //Returns true if  the given string is a Japan mobile phone number	(05012345678 for example)
    if(! isPhoneNumber(phoneNumber)) return false;
    var x= phoneNumber.replace(/[^0-9]/g, "");
		
    //Must contain 10 numbers
    numbers=x.replace(/\s+ \-/g, "");
    if(numbers.length!=11) return false;
	
    //Must start with 050
    if (!(/^(050)\d+$/).test(numbers)) return false;
	
    return true;
}

function isHiragana(name){
    var x= name.replace(/\s+/g, ""); 
    if (!(/^[\u3040-\u309f]+$/).test(x)) return false;	
    return true;
}

function isKatakana(name){
    var x= name.replace(/\s+/g, ""); 
    if (!(/^[\u30a0-\u30ff]+$/).test(x)) return false;	
    return true;
}

function isKana(name){
    var x= name.replace(/\s+/g, ""); 
    if (!(/^([\u3040-\u309f]|[\u30a0-\u30ff])+$/).test(x)) return false;	
    return true;
}

function isKanji(name){
    var x= name.replace(/\s+/g, ""); 
    if (!(/^[\u4e00-\u9faf]+$/).test(x)) return false;	
    return true;
}

function isJapaneseCharacter(strSource){
//Returns true if String value contains only Jappqnes chars (used by name(kanji) field)	
//updated by Michael 2012/01 : added double-byte space (charCode=#3000)
	var x= strSource.replace(/\s+/g, ""); 
	if (!(/^(\u3000|\u3005|[\u4e00-\u9faf]|[\u3040-\u309f]|[\u30a0-\u30ff])+$/).test(x)) return false;
	return true;
} 

function addBrastelValidationMethods(){
    //Add Brastel validation method to Validation jquery	plugin.
    jQuery.validator.addMethod(
        "phoneNumberMethod", 
        function(phone_number, element) {
            if(this.optional(element)) return true;
            return isPhoneNumber(phone_number);
        },
        translate("I0001-0073-0003","Please specify a valid phone number (only numbers, spaces, hyphens and parenthesis)")
        );
	
    jQuery.validator.addMethod(
        "japanPhoneNumberMethod",
        function(phone_number, element) {
            if(this.optional(element)) return true;
            return (isJapanFixedPhoneNumber(phone_number) || isJapanMobilePhoneNumber(phone_number) || isJapanIPPhoneNumber(phone_number)) ;
        },
        translate("I0001-0073-0004","Please enter valid Japanese phone number .")
        );
	
    jQuery.validator.addMethod(
        "mobilePhoneNumberMethod", 
        function(phone_number, element) {
            if(this.optional(element)) return true;
            return isJapanMobilePhoneNumber(phone_number);
        },
        "Please specify a valid fixed mobile number (070 / 080 / 090)"
        );
	
    jQuery.validator.addMethod(
        "ipPhoneNumberMethod", 
        function(phone_number, element) {
            if(this.optional(element)) return true;
            return isJapanIPPhoneNumber(phone_number);
        },
        "Please specify a valid fixed mobile number (050)"
        );
	
    jQuery.validator.addMethod(
        "fixedPhoneNumberMethod",
        function(phone_number, element) {
            if(this.optional(element)) return true;
            return isJapanFixedPhoneNumber(phone_number);
        },
        "Please specify a valid fixed phone number (10 digits)"
        );
	
    jQuery.validator.addMethod(
        "hiraganaMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return isHiragana(source);
        },
        "Hiragana only !"
        );
	
    jQuery.validator.addMethod(
        "katakanaMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return isKatakana(source);
        },
        translate("I0001-0073-0014","Katakana only !")
        );
	
    jQuery.validator.addMethod(
        "kanaMethod", 
        function(source, element) {
            if(this.optional(element)) return true;
            return isKana(source);
        },
        translate("I0001-0073-0014","Kana only (hiragana or katakana) !")
        );
	
    jQuery.validator.addMethod(
        "kanjiMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return isKanji(source);
        },
        "Kanji only !"
        );
	
    jQuery.validator.addMethod(
        "japaneseCharacterMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return isJapaneseCharacter(source);
        },
        translate("I0001-0073-0005","Japanese characters only !")
        );
	
    /* Japanese Bank account numbers : from 7 numbers to 13 numbers */
    jQuery.validator.addMethod(
        "accountNumberMethod", 
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^\d{7,13}$/).test(source));
        },
        function() {
            return translate("I0001-0073-0006","Account number must have from 7 to 13 numbers")
        }
      );
	
    /* Destination Bank account numbers : 7 numbers */
    jQuery.validator.addMethod(
        "destinationAccountNumberMethod", 
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[0-9a-zA-Z]{4,25}$/).test(source));
        },
        function() {
            return translate("I0001-0073-0019","Account number must have from 4 to 25 letters or numbers")
        }
      );	
	
    /* Bank codes : 4 numbers */
    jQuery.validator.addMethod(
        "bankCodeMethod", 
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^\d{4}$/).test(source));
        },
        "Bank number must have 4 numbers"
        );	
	
    /* Bank codes : 4 numbers */
    jQuery.validator.addMethod(
        "branchCodeMethod", 
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^\d{3}$/).test(source));
        },
        "Branch code must have 3 numbers"
        );		
	
	
    jQuery.validator.addMethod(
        "alphabetMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[0-9a-zA-Z_=,\-. ]+$/).test(source));
        },
        translate("I0001-0073-0007","Only letters, numbers, - and .")
        );
	
    /* Brastel Remit password : 
	- only letters, numbers, hyphens (-), underscore (_) and period (.) are accepted. 
	- between 8 and 16 characters long. 
	*/
    jQuery.validator.addMethod(
        "passwordMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[0-9a-zA-Z_\\-\\. ]{8,16}$/).test(source));
        }, 
        translate("I0001-0073-0008","8 to 16 characters long, only letters, numbers, hyphens (-), underscore (_) and period (.)")
        );
	
    /* Authentication code sent by email when user register a new mail adress*/
    jQuery.validator.addMethod(
        "authenticationCodeMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[0-9a-zA-Z]{12}$/).test(source));
        }, 
        translate("I0001-0073-0009","12 aphanumeric characters")
        );
	
    /* Brastel Card access code : 6 or 8 digits*/
    jQuery.validator.addMethod(
        "brastelCardAccessCodeMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^(\d{6}|\d{8})$/).test(source));
        }, 
        translate("I0001-0073-0010","6 or 8 digits")
        );
	
    /* Brastel Card PIN code : 4 digits*/
    jQuery.validator.addMethod(
        "brastelCardPinMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^\d{4}$/).test(source));
        }, 
        translate("I0001-0073-0011","4 digits")
        );
	
    /* Username (registration process) */
    jQuery.validator.addMethod(
        "usernameMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[0-9a-zA-Z_\\-\\.]+$/).test(source));
        }, 
        translate("I0001-0073-0012","Wrong username format, only numbers, letters, - , _,.")
        );
	
    /* name alphabet (registration process) */
    jQuery.validator.addMethod(
        "nameAlphaMethod",
        function(source, element) {
            if(this.optional(element)) return true;
            return ((/^[a-zA-Z_=\-\\-\\. ]+$/).test(source));
        }, 
        translate("I0001-0073-0013","only letters, - , _,.")
        );
            
    jQuery.validator.addMethod("tsuuchouBangouMethod", function(source, element) {
        if(this.optional(element)) return true;
        return ((/^\d{8}$/).test(source));
    }, translate("I0001-0057-0044","Post Office Bank Account Number should have format 5 digits 記号 and 8 digits 番号"));
    
    jQuery.validator.addMethod("kigouBangouMethod", function(source, element) {
        if(this.optional(element)) return true;
        return ((/^\d{5}$/).test(source));
    }, translate("I0001-0057-0044","Post Office Bank Account Number should have format 5 digits 記号 and 8 digits 番号"));
       
}



/* Functions used to clean the form datas (before valiadtion)?@*/
var dblByte = ["\uFF10","\uFF11","\uFF12","\uFF13","\uFF14","\uFF15","\uFF16","\uFF17","\uFF18","\uFF19"];

function cleanInputText(input){
    //Cleans the content of a input  field	
    var text=input.val();
    //Remove leading and trailing spaces
    text=jQuery.trim(text);
	
    //Remove double spaces
    text=text.replace(/\s+/gi," ");
	
    //Replaces double-bytes numbers by single-bytes
    text=toSglByte(text);
    input.val(text);
	
}

function cleanFormData(form){
    //Remove trailings spaces from all fields and keep only numbers form phone numbers fields.	
    var input=null;
    $("input[type=text]",$(form)).each(function(index,element){
        var input=$(element);
        cleanInputText(input);
    });
	
    $("input.japanPhoneNumberMethod,input.phoneNumberMethod",$(form)).each(function(index,element){
        input=$(element);
        var x= input.val().replace(/[^0-9]/g, "");	
        input.val(x);
    });
	
}//function

function toSglByte(inpVal)
{
    for ( i = 0; i < 10; i++ )
    {
        if ( inpVal.indexOf(dblByte[i]) > -1)
        {
            var regex = new RegExp(dblByte[i],"g")
            inpVal = inpVal.replace(regex,i);
        }
    }
    return inpVal;
}