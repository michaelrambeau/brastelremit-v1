/*
Calculator object used by the Remittance Request form Customer site and CRM) and Home Calculator page
Last update : Michael 2013-08-29 Multibroker
*/

var RemitCalculator=function(options,html){
	
	var defaultOptions = { 
		isFeeIncludedInYenField: false,//is the remittance fee included in the field use to enter the amount in yens ?
        //true => the user enters the amount to deposit, the fee will be deducted to calculate the amount to send.
        //false (by default) => the user enters the amount to send, the deposit fee will be added to calculate the amount to deposit 
        
		currencies:[
			{code:"USD",text:"US dollar",symbol:"$",exchangeRate: 80}
		],	
                
		destinations: [
            {
                countryCode:'BD',
                currencies:[
                    {
                        currencyCode: 'BDT',
                        currenciesPerDollar: 83.4,
                        yensPerDollar: 103.07
                    }
                ]
            }
        ],
        
		maxAmountToRemit: 1000000,//maximum amount to remit (=deposit - fee)
		maxInputYen:0,//used to prevent the CRM user from entering more than the user balance ("Process balance" action)
			
		//Fees from yens deposit
        fees:{
            ALL:[
                {maxAmount: 30000, fee: 800},
                {maxAmount: 100000, fee: 1400},
                {maxAmount: 500000, fee: 1600}
            ],
            MM:[
                {maxAmount: 500000, fee: 1800}
            ]
        },
                
		userBalance: 0,//current balance used to calculate the credit
		userFeeDiscount: 0,//fee discount percentage
		specialExchangeRateDiscount: 10,//discount percentage on exchange rate
		isSpecialRateApplied: false,//is the special exchange rate applied for the current user ?
	
		thousandsSeparator : ",",
		decimalSeparator : ".",
	
		msgEnterAmount:"Enter Amount",
		errorMessages:[
            "The minimum amount to deposit is &yen;[1]",
            "Please enter a deposit amount lower than &yen;[1] or higher than &yen;[2]",
            "The deposit amount exceeds the maximum limit ([1] including remittance fee).",
            translate('I0001-0041-0007',"The amount to remit exceeds the maximum limit [1]."),
            translate('I0001-0043-0090',"Enter the amount to deposit or the amount the beneficiary will receive."),
            "You cannot enter more than [1] yens.",//used for process balance action
            translate('I0001-0041-0007','The amount to remit exceeds the maximum limit [1]')
		],//the curled brackets are used as "place holders" for numeric values.
		
		isFromYen: true,//booleen used to store the way the calculator works:
        //true => from yen to foreign currency ("from left to right")
        //false => from foreign currency to yen
		
		debugMode: false//to disable console log messages
        
        //maximumFeeCountries: []//array of countries where the highest fee applies, for any amount. ()
		
	};  
	this.options = $.extend(defaultOptions, options);
	
	defaultHtml={
		//The 2 text fields used for UI
		inputYenAmount : $('#yenAmount'),
		inputDeliveryAmount : $('#fgnAmount'),
		
		//DOM elements used to display results
		displayDepositAmount: $('#depositAmountValue,.depositAmountValue'),		
		displayDepositAmountRegular: $('.depositAmountValueRegular'),	
		displayDepositAmountSpecial: $('.depositAmountValueSpecial'),	

		displayRemitFee: $('#remittanceFeeValue,.remittanceFeeValue'),
		
		displayRemitAmountYen: $('#remittanceAmountYenValue'),
		displayRemitAmountYenRegular: $('.remittanceAmountYenRegular'),
		displayRemitAmountYenSpecial: $('.remittanceAmountYenSpecial'),
		displayExchangeRate: $('#exchangeRateValue'),
		displayYensPerDollar:  $('#yensPerDollar'),
		displayExchangeRateForeignCurrency: $('#exchangeRateValueForeignCurrency'),
		displayDollarsPerForeignCurrency: $('#dollarsPerForeignCurrency'),
		displayRegularExchangeRate: $('#regularExchangeRateValue'),
		displayPreferentialExchangeRate: $('#preferentialExchangeRateValue'),
		
		displayDeliveryAmount: $('#deliveryAmountValue'),
		displayDeliveryAmountRegular: $('.deliveryAmountRegular'),
		displayDeliveryAmountSpecial: $('.deliveryAmountSpecial'),
		
		displayAmountBilled: $('#amountBilledValue'),
		
		displayForeignCurrencyText: $('.foreign-text'),
		displayForeignCurrencySymbol: $('.foreign-symbol,.foreign-code'),//bug correction .foreign-code added 2012-04-26.
		
		displayCurrentBalance: $('.currentBalanceValue'),
		displayNextBalance: $('.nextBalanceValue'),
		displayUsedBalance: $('.usedBalanceValue'),
		displayCredit: $('.creditValue'),
		displayFeeDiscountYen: $('#remittanceFeeDiscountValue'),
		displayExchangeRateDiscountYen: $('#exchangeRateDiscountValue'),
		
		//Exchange rates (used in Exchange rates page)
		displayCurrenciesPerYenRegular: $(".currenciesPerYenRegular"),
		displayCurrenciesPerYenSpecial: $(".currenciesPerYenSpecial"),
		displayYensPerDollarRegular: $("#yensPerDollarRegular"),
		displayYensPerDollarSpecial: $("#yensPerDollarSpecial"),
		displayDollarsPerCurrencyRegular: $("#dollarsPerCurrencyRegular"),
		displayDollarsPerCurrencySpecial: $("#dollarsPerCurrencySpecial"),		
		
		//Hidden fields used to submit data, filled with numeric values
		dataDepositAmount: $('input[name=depositAmount]'),//Amount to deposit in Japan = Amount to remit + fee
		dataDeliveryAmount: $('input[name=deliveryAmount]'),//Amount to remit in local currency
		dataRemitFee: $('input[name=remittanceFee]'),
		dataRemitAmountYen: $('input[name=remittanceAmountYen]'),//Amount to remit in yens
		dataExchangeRate: $('input[name=exchangeRate]'),
		dataExchangeRateId: $('input[name=referenceExchangeRateHistoryID]'),
		dataCredit: $('input[name=creditValue]'),

		displayError: $('.calc-error'),
		iconTriangles: $(".icon-triangles")
	};
	
	this.html = $.extend(defaultHtml, html);
	
	//A status used to know if entered data are OK (can be submitted)
	this.status=0;
	this.activeCurrency=null;
	this.activeRate=null;
	
	
	//Object used to store numeric values
	this.data={
		depositAmount : 0,
		depositAmountRegular: 0,
		depositAmountSpecial: 0,		
		remitFee : 0,
		remitAmountYen : 0,
		remitAmountYenSpecial : 0,		
		remitAmountYenRegular : 0,		
		deliveryAmount : 0,
		deliveryAmountRegular: 0,
		deliveryAmountSpecial: 0,		
		credit:0,
		feeDiscountYen:0,
		exchangeRate:1,
		exchangeRateRegular:1,
		exchangeRateSpecial:1,
		exchangeRateDiscountYen:0,
		isSpecialRateApplied:false
	};
    
    this.destinationData={
      currencyCode:'?',
      currenciesPerDollar: 0,
      yensPerDollar: 0,
      maximumAmount: 0
    };
	
	//We need a variable to store the context object,
	//since "this" keyword will has a different meaning inside the event listeners and jQuery.each() function.
	var o=this;
	
	this.mapCurrencies=[];
	jQuery.each(this.options.currencies,function(index,element){
		 o.mapCurrencies[element.countryCode]=element;
	 });
	this.activeCountryCode="";//this.options.currencies[0].countryCode;
	
	//Blank default values (to avoid previous values to be displayed, when reloading the page)
	this.html.inputYenAmount.val("");
	this.html.inputDeliveryAmount.val("");
	
	this.html.inputYenAmount.keyup(function(){
		//$(document).stopTime("error");
		o.clearError();
		o.status=0;
		if ( findDblByteNums($(this).val()) ) $(this).val(toSglByte($(this).val()));
		if ( $(this).val() == 0 ) $(this).val("");
		if ( $(this).val() == "" ){
			//o.clear(o.html.inputDeliveryAmount);
			o.reset();
			o.updateInterface();
		}
		else
		{
			o.isFromYen=true;
			o.calculate();
		}
	});//keyup
	
	
	this.html.inputDeliveryAmount.keyup(function(event){
		o.clearError();
		o.status=0;
		if ( findDblByteNums($(this).val()) ) $(this).val(toSglByte($(this).val()));
		var charCode = (event.which) ? event.which : event.keyCode;
		if ( charCode == 110 ) // if "."
		{
			if ( $(this).val().split(".")[1] == "" )
			{
				var int = parseInt($(this).val().replace(/[^0-9]/g, ""));
				 if ( !isNaN(int) ) $(this).val(addCommaSeparator(int.toString())+"." );
			}
			return false;
		}
		if ( $(this).val() == "" )
		{
			o.clear(o.html.inputYenAmount);
			o.reset();
			return false;
		}
		if ( charCode >=37 && charCode <= 40 ) return false; // arrow keys
		
		var cpos = getSelectionStart(o.html.inputDeliveryAmount.get()[0]);
		var valLength = $(this).val().length;
		if ( $(this).val().match(/\d+\.0$/) && cpos == valLength ) return false;
		
		$(this).val($(this).val().replace(/[^0-9\.]/g, ""));
		
		o.isFromYen=false;
		o.calculate();
		
	});//keyup
	

	$("input.numbersOnly").keypress(function(event){
		//o.clearError();
		var charCode = (event.which) ? event.which : event.keyCode;
		if ( $(this).hasClass("amountVal") && $(this).val() == "" )
		{
			if(charCode==48) return false;
		}
		if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
		return;
	});
	$("input.numbersWithDecimals").keypress(function(event){
		//o.clearError();
		var cpos = getSelectionStart(document.getElementById('fgnAmount'));
		var valLength = $(this).val().length;
		var dotIdxFxd = valLength - 3;
		var dotIdx = $(this).val().indexOf(".");
		var charCode = (event.which) ? event.which : event.keyCode;
		
		if ( charCode == 8 || charCode >= 37 && charCode <= 40 ) return; // backspace, arrow keys
		if ( dotIdx > -1 && dotIdx == dotIdxFxd && cpos > dotIdxFxd ) return false; // prevents entering more than 2 decimals
		if ( dotIdx > -1 && dotIdx == valLength-2 && charCode == 48 && cpos == valLength ) return false; // prevents second "0" decimal
		
		if ( charCode == 46 && dotIdx > -1 ) return false; // "."
		if ( charCode == 46 && $(this).val() == "" ) return false; // "."
		if (  charCode == 46 ) return;
		if ( $(this).hasClass("amountVal") && $(this).val() == "" )
		{
			if(charCode==48) return false;
		}
		if (charCode > 31 && (charCode < 48 || charCode > 57) ) return false;
		return;
	});
	
	
	$("input.amount").keydown(function(){
		if ( $(this).val() == o.options.msgEnterAmount || $(this).val() == "" ) 
		{
			$("input.amount").val("").removeClass("blank");
		}
	}).keyup(function(){
		if ( $(this).val() == "" ) 
		{
			//$("input.amount").val(o.options.msgEnterAmount).addClass("blank");
			//showTip();
		}
		else
		{
			//hideTip();
			var maxLength = $(this).attr("maxlength");
			if ( $(this).val().length > maxLength )
			{
				var newVal = $(this).val().substring(0,maxLength);
				if ( newVal.indexOf(".") == -1 )
				{
					newVal = newVal.replace(/[^0-9]/g, "");
					newVal = addCommaSeparator(newVal);
				}
				$(this).val(newVal);
			}
		}
	}).click(function(){
		if ( $(this).val() == o.options.msgEnterAmount ) $(this).val("");
		else $(this).select();
	});

	
	
	this.reset=function(){
		var x=o.data;
		x.depositAmount=0;
		x.remitFee=0;
		x.feeDiscountYen=0;
		x.remitAmountYen=0;
		x.deliveryAmount=0;
		x.credit=0;
	};
    
    /* andrew 2013-08-22 No longer necessary since the specific fees are provided
	this.isMaximumFeeApplied = function(){
        //Return true if the maximum fee is applied for the current country (no matter the amount to send)
        //used for Myanmar destination (2013/08)
        if(!o.destinationData) return false;
        var countryCode = o.destinationData.countryCode;
        var found = jQuery.inArray(countryCode,o.options.maximumFeeCountries) != -1;
        return found;
    };*/
	
    this.getFee=function(yens){
		// returns an object with
		// - fee: fee for the remittance
		// - maxAmountToRemit: the maximum amount allowed
		
        var countryCode = o.destinationData.countryCode;
	//Get the fee value for a given amount in yens (deposit or amount to send, dependong on the context)
	//The user fee discount is NOT included in this calculation.
    
        //var points=this.getPoints();
        
        var countryCode = this.activeCountryCode;
        var points = o.options.fees[countryCode] ? o.options.fees[countryCode] : o.options.fees['ALL'];

		/* andrew 2013-08-22 No longer necessary since the specific fees are provided
        if(o.isMaximumFeeApplied()){
            o.log("The highest fee applies for this country");
            return points[points.length-1].y;
        }*/
        
		var x=0;//amount in yens
		var y=0;//fee
		
		for(var i=0 ; i < points.length ; i++){
			x=points[i].maxAmount;
			y=points[i].fee;
			if(this.isFeeIncludedInYenField && x>0) x=x+y;
			if(yens<=x) {
				return y;
			}
		}
		return 0;
    };
	
	this.substractDiscount=function(value,discount){
	//Substract the percentage discount from a given value	
		var x=parseFloat(value);
		return x - (value * discount / 100);
	};
    
    this.checkAmountToDeliver = function(fgnAmount) {
        //Multibroker update: first check if the amount to deliver is less than the max. allowed for the current destination
        if ((o.data.maxAmountToDeliver > 0) && (fgnAmount > o.data.maxAmountToDeliver)){
            o.showError(6,[
                o.data.currencyCode+' '+o.formatForeign(o.data.maxAmountToDeliver)
                
            ]);
			o.updateInterface({
                errorRemit: !o.isFromYen,
                errorDeposit: o.isFromYen
            });
			return false;
		}
        return true;
    };
	
	this.checkDeposit=function(deposit){
	//Returns True if the given deposit value is OK.
	//must be not too small, not too big...
	//Some forbidden ranges : between 30881 and 31489, 101480 and 101680
	
		if(o.options.maxInputYen>0 && deposit>o.options.maxInputYen){
			o.showError(5,[o.options.maxInputYen]);
			return false;
		}
		
        var points= o.options.fees[o.activeCountryCode];
        if(!points) points = o.options.fees['ALL'];
        
		var maxAmountToRemit = o.options.maxAmountToRemit;

		var minAmount=points[0].fee;
		if (deposit <= minAmount){
				//We display the message a few milliseconds... 
				//because "we don't know if the customer has finished typing"
				$(document).oneTime(1000,"error",function(){
					  o.showError(0,[minAmount]);
			  });
			
			return false;
		}
		
		for(var i=0 ; i<points.length - 1; i++){
			x1=points[i].maxAmount + points[i].fee;
			x2=points[i].maxAmount + points[i+1].fee;
			if ((deposit > x1) &&  (deposit<x2)){
				this.showError(1,[formatYen(x1),formatYen(x2)]);
				return false;
			}
		}
		
		var maxFee=points[points.length-1].fee;
		if ( (deposit - maxFee  ) > maxAmountToRemit){
				this.showError(2,[formatYen(maxAmountToRemit+maxFee)]);
				return false;
		}
		
		return true;
	};
	
	this.checkAmountToRemit=function(amount, maxAmountToRemit){
		if ( (amount ) > maxAmountToRemit){
				o.showError(3,[formatYen(maxAmountToRemit,true)]);
				return false;
		}
		return true;
	};
	
	
	this.calculateForeignRemit=function(){
	//The deposit amount field value has been changed, launchs the calculation from yen to foreign currency
		var value=o.html.inputYenAmount.val();
		var x=parseInt(value.replace(/[^0-9]/g, ""));
		if(isNaN(x)) x=0;
		
		var fee0=0,fee1=0;//remittance fees, before and after discount
		var credit=0;
		
		fee0 = o.getFee(x);
		var maxAmountToRemit = o.options.maxAmountToRemit;
		
		if(o.options.isFeeIncludedInYenField){
			if (x == "" ){
				o.clear(o.html.inputYenAmount);
				return false;
			}
			if (!o.checkDeposit(x)){
				o.reset();
				o.updateInterface({errorDeposit:true});
				return false;
			}
			//fee0=o.getFee(x);
			fee1=o.substractDiscount(fee0,o.options.userFeeDiscount);
			
			credit=(o.options.userBalance > x) ? x : o.options.userBalance;
			o.data.depositAmount=x - credit;
			o.data.remitAmountYen = x - fee1;
            o.data.remitAmountYenSpecial = o.data.remitAmountYen;
            o.data.remitAmountYenRegular = o.data.remitAmountYen;
		}
		else{//User enters amount to remit
			if (!o.checkAmountToRemit(x, maxAmountToRemit)){
				o.reset();
				o.updateInterface({errorDeposit:true});
				return false;
			}
			//fee0 = o.getFee(x);
			fee1=o.substractDiscount(fee0,o.options.userFeeDiscount);
			var total=x+fee1;
			
			if(o.options.feeIncluded){
				o.data.remitAmountYen = x - fee1;
			}
			else{
				o.data.remitAmountYen = x;
			}
			o.data.remitAmountYenRegular = o.data.remitAmountYen;
			o.data.remitAmountYenSpecial = o.data.remitAmountYen;
			
			credit=(o.options.userBalance > total) ? total : o.options.userBalance;
			o.data.depositAmount = o.data.remitAmountYen - credit + fee1;
			o.data.depositAmountRegular = o.data.remitAmountYenRegular - credit + fee1;
			o.data.depositAmountSpecial = o.data.remitAmountYenSpecial - credit + fee1;
			
		}
		
		o.data.remitFee = fee1;
		o.data.feeDiscountYen=fee1-fee0;
		o.data.credit=credit;
		
		var fgnAmount = o.data.remitAmountYen / o.data.exchangeRate;
        
        if (! o.checkAmountToDeliver(fgnAmount)) return false;        
        
		o.data.deliveryAmount=fgnAmount;
		
		o.data.deliveryAmountRegular=o.data.remitAmountYen / o.data.exchangeRateRegular;
		o.data.deliveryAmountSpecial=o.data.remitAmountYen / o.data.exchangeRateSpecial;
		
		o.status=2;
		o.updateInterface();
	};//function calculateForeignRemit
	
	this.showError=function(errorNumber,placeHolderValues){
	//Shows the message error related to the given error number
	//placeHolderValues is an array of String that will replace the numeric values between brackets [1]
		$(document).stopTime("error");
		var msg=this.options.errorMessages[errorNumber];
		jQuery.each(placeHolderValues,function(index,element){
			var strRegExp="\\["+(index+1)+"\\]";
			re=new RegExp(strRegExp,"g");								  
			msg=msg.replace(re,element);
		});//each
		
		this.status=1;
		this.html.displayError.html(msg).show();
	};
	
	this.clearError=function(){
        //if(window.console) console.log("clear error");
		this.html.displayError.hide();
		$(document).stopTime("error");
	};
	
	
	this.calculateYenDeposit=function(){ 		
	//The value of the foreign amount field has been changed	=> calculate the amount to deposit		
		var value=o.html.inputDeliveryAmount.val();
		var fgnAmount = this.getForeignAmountFromText(value);
		if(fgnAmount==0){
			this.clear(this.html.inputDeliveryAmount );
			this.reset();
			return;
		};
        
        //Multibroker update: first check if the amount to deliver is less than the max. allowed for the current destination
        if (! o.checkAmountToDeliver(fgnAmount)) return false;
		
		this.data.deliveryAmount=fgnAmount;
		this.data.deliveryAmountRegular=fgnAmount;
		this.data.deliveryAmountSpecial=fgnAmount;
		
		var yenAmount = Math.round(fgnAmount * o.data.exchangeRate);//no decimals
		var yenAmountRegular=Math.round(fgnAmount * o.data.exchangeRateRegular);
		var yenAmountSpecial=Math.round(fgnAmount * o.data.exchangeRateSpecial);
		
		var fee0 = this.getFee(yenAmount);
		var maxAmountToRemit = o.options.maxAmountToRemit;

		var fee1=o.substractDiscount(fee0,o.options.userFeeDiscount);
		
		o.data.remitFee = fee1;
		o.data.feeDiscountYen=fee1-fee0;
		o.data.credit=o.options.userCredit;
		
		var total=yenAmount + fee1;
		var credit=(o.options.userBalance > total) ? total : o.options.userBalance;
		this.data.depositAmount=yenAmount - credit + fee1;
		this.data.depositAmountRegular = yenAmountRegular - credit + fee1;
		this.data.depositAmountSpecial = yenAmountSpecial - credit + fee1;
		
		
		this.data.remitAmountYen = yenAmount;
		this.data.remitAmountYenRegular = yenAmountRegular;
		this.data.remitAmountYenSpecial = yenAmountSpecial;
		
		this.data.credit=credit;
		
		if (yenAmount > maxAmountToRemit){
			if(o.options.isFeeIncludedInYenField){
				this.showError(2,[formatYen(maxAmountToRemit+fee1)]);
			}
			else{
				this.showError(3,[formatYen(maxAmountToRemit,true)]);				
			}
			this.reset();
			this.updateInterface({errorRemit:true});
			return false;
		}
		
		this.status=2;		
		this.updateInterface();
			
	};// .calculateYenDeposit()
	
	this.calculate=function(){
		//Performs the calculation, from yens to currencies or from currencies to yens, depending on the context.
		if(o.isFromYen){
			this.calculateForeignRemit();
		}
		else{
			this.calculateYenDeposit();
		}
	};
			
	this.getForeignAmountFromText=function(text){
	//Converts a given text, containing thousands separator, in a float value, with 2 decimals 
		if(text=="") return(0);
		var regExM =  new RegExp(this.options.thousandsSeparator,"g");
		var amountVal = text.replace(regExM, "");
		
		var int = parseInt(text.replace(regExM, ""));
		var dec = Math.round(amountVal%1*100)/100;
		
		var fgnAmount = int+dec;
		return fgnAmount;
	};
	
	this.round=function(x,nbDecimal){
        //Round a number to n decimals
        //We cannot use toFixed() function that is buggy 0.15.toFixed(1) returns 0.1 instead of 0.2!
		if(nbDecimal == null) nbDecimal = 2;
		var y=Math.pow(10,nbDecimal);
		var z=Math.round(x*y)/y;
		return z;
	};
	
	this.roundExchangeRate=function(rate){
	//Round the exchnage rate displayed inthe interface, using 5 significant numbers	
		if(rate==0) return 0;//Number(rate).toPrecision(10)
		var nbDecimal=10;
        return o.round(rate,nbDecimal);
	};
	
	this.updateCurrency=function(){
		//When the selected country has been modified (activeCountryCode) , update the DOM elements with the currency symbol	
		var currency=this.activeCurrency;///this.mapCurrencies[this.activeCountryCode];//this.activeRate//
		var currencyCode=currency.currencyCode;		
		this.html.displayForeignCurrencyText.html(currency.currencyTranslation);
		this.html.displayForeignCurrencySymbol.html(currencyCode);

	};
	
	this.updateRate=function(){
		//When the rate exchange rate has been modified, update te DOM elements that display the rate
		var regularRate = this.activeRate.exchangeRate;
		var discount = o.options.specialExchangeRateDiscount;//(o.options.anonymous==true) ? 0 : this.activeRate.exchangeRateDiscount;
		var specialRate = this.substractDiscount(regularRate,discount);
		var userRate=(o.options.isSpecialRateApplied) ? specialRate : regularRate;
		
		o.data.exchangeRate = userRate;
		o.data.exchangeRateDiscountYen = specialRate - regularRate;
		o.data.exchangeRateRegular = regularRate;
		o.data.exchangeRateSpecial = specialRate;		
		
		this.html.displayExchangeRateForeignCurrency.html(this.roundExchangeRate(userRate));
		this.html.displayYensPerDollar.html(this.roundExchangeRate(this.activeRate.yensPerDollar));
		this.html.displayDollarsPerForeignCurrency.html(this.roundExchangeRate(userRate/this.activeRate.yensPerDollar));
		this.html.displayExchangeRate.html(this.roundExchangeRate(1/userRate));
		
		//Exchange rates page
		//1. Today's rate (currencies per yen)
		this.html.displayCurrenciesPerYenRegular.html(this.roundExchangeRate(1/regularRate));
		this.html.displayCurrenciesPerYenSpecial.html(this.roundExchangeRate(1/specialRate));
		//2. Brastel rate (yens per dollar)
		this.html.displayYensPerDollarRegular.html(this.activeRate.yensPerDollar);
		this.html.displayYensPerDollarSpecial.html(((1 - discount / 100) * this.activeRate.yensPerDollar).toFixed(2));
		//3. USD per foreign currencies
		var rate=1 / this.activeRate.currenciesPerDollar;
		this.html.displayDollarsPerCurrencyRegular.html(this.roundExchangeRate(rate));
		this.html.displayDollarsPerCurrencySpecial.html(this.roundExchangeRate((1 - discount / 100) * rate));
		
		
		this.html.displayRegularExchangeRate.html(this.roundExchangeRate(1/regularRate));
		this.html.displayPreferentialExchangeRate.html(this.roundExchangeRate(1/specialRate));
		$("tr.exchange-rate-detail").toggle(discount>0);
	};
	
	
	this.clear=function(input){
		input.val("");
	};
	
	this.formatForeign=function(value,nbDecimal){
        //Format amounts in the foreign currency, using 2 decimals and the comma character (,) to separate thousands.
        var i = (nbDecimal == undefined) ? 2 : nbDecimal; 
		var int = Math.floor(value);//"3"
        var dec = value - int;//"0.141592654"
		var strInt = addCommaSeparator(int.toString());
       //var strDec = o.round(dec,i).toString()+"";//"0.14"
        var x = o.round(dec,i);
        var strDec = (x == 0) ? "00" : (x.toString()+"00").substr(2,i);
        var result = (i==0) ? strInt : strInt+"." + strDec;
		return result;
	};	
	
	this.getYenFromInput=function(){
		var value=this.html.inputYenAmount.val();
		return value.replace(/[^0-9]/g, "");
	};
	this.getForeignFromInput=function(){
		return this.getForeignAmountFromText(this.html.inputDeliveryAmount.val());
	};
    
    this.getDestination = function(countryCode0){
        var destination = null;
        jQuery.each(o.options.destinations,function (index,element) {
            if(element.countryCode == countryCode0) destination=element;
        });
        return destination;
    };

	this.setCountryCode = function(countryCode){
	// sets the country code
		this.activeCountryCode = countryCode;
	};
		
	this.switchCurrency=function(countryCode){
		var destination = o.getDestination(countryCode);
		this.setCountryCode(countryCode);
		this.activeCurrency = destination.currencies[0];
		this.updateCurrency();
        this.setExchangeRate(this.activeCurrency);
	};
	
	this.setExchangeRate=function(rateObject){
		//update the calculator from a JSON object that comes from an ajax request
		this.activeRate = rateObject;
		//yens per currency!
		this.activeRate.exchangeRate = stringToFloat(rateObject.yensPerDollar / rateObject.currenciesPerDollar);
		this.activeRate.currenciesPerDollar = stringToFloat(rateObject.currenciesPerDollar);
		this.activeRate.yensPerDollar = (stringToFloat(rateObject.yensPerDollar)).toFixed(2);
		this.activeRate.exchangeRateDiscount = stringToFloat(rateObject.exchangeRateDiscount);
		
		//this.options.specialExchangeRateDiscount = this.activeRate.specialExchangeRateDiscount;
		this.options.isSpecialRateApplied = (this.activeRate.specialExchangeRateAppliedFlag == "BRS");

		this.updateRate();
		var currencyCode=rateObject.currencyCode;	
		
		this.html.displayForeignCurrencyText.html(rateObject.currencyTranslation);
		this.html.displayForeignCurrencySymbol.html(currencyCode);
	};
	
    this.setDestinationData = function(json){
        //called when agent data have been retrieved by an ajax call, in order to update data related to the destination 
        o.destinationData = json;
        o.data.maxAmountToDeliver = stringToFloat(json.maximumAmount);
        o.data.currencyCode = json.currencyCode;
        o.options.specialExchangeRateDiscount = stringToFloat(json.specialExchangeRateDiscount);
        var currenciesPerDollar = stringToFloat(json.currenciesPerDollar);
        var yensPerDollar = stringToFloat(json.yensPerDollar);
        o.activeRate = {
            currencyCode: json.currencyCode,
            yensPerDollar: yensPerDollar,        
            currenciesPerDollar: currenciesPerDollar,
            exchangeRate:  yensPerDollar / currenciesPerDollar,
            id: json.id
        };
        o.html.displayForeignCurrencySymbol.html(json.currencyCode);
        o.updateRate();
    };
    
	this.switchBank=function(brokerCode,agentCode){
		var key=brokerCode+agentCode;
		this.activeRate=this.activeCurrency.rates[key];
		if(this.activeRate==undefined){
			alert("No exchange rate for the selected bank / agent.\nBrokerCode="+brokerCode+"\nAgentCode="+agentCode);
			return;
		}
		this.updateRate();
		if (this.status==2){
			this.calculate();
		}		
	};
	
	this.validate=function(){
		//	Returns true if the form that contains the calculator can be submitted
		if(this.status==0){
			msg=this.options.errorMessages[4];
			this.html.displayError.html(msg).show();
			return false;
		}
		if(this.status==1){
			if(this.html.inputYenAmount.val() != "") this.html.inputYenAmount.focus();
			return false;
		}
		return true;
	};
	
	this.roundDeliveryAmount=function(value){
	//Amount to deliver (in the foreign currency) is rounded to 2 decimals, the last decimal is rounded to the lower number)	
		var i=Math.round(value * 100);
		var x=i/100;
		return x;
	};
    
	this.roundRemitAmountYen=function(value){
	//Round amount to remit to the upper integer.
		var i=Math.round(value);
		return i;
	};
	
	this.updateInterface=function(options){
	//A calculation has just been made, the HTML interface must be updated from the values (that are stored in the object attributes)
	
		var defaults={
			errorDeposit:false,
			errorRemit:false
		};
		var context = $.extend(defaults, options);
	

		var yens=(o.options.isFeeIncludedInYenField) ? o.data.remitAmountYen + o.data.remitFee-o.data.feeDiscountYen: o.data.remitAmountYen;

		yens=o.roundRemitAmountYen(yens);
		if (context.errorDeposit) yens=o.getYenFromInput();
		var strYens=formatYen(yens,false,true);
		
		var foreign=(context.errorRemit) ? this.getForeignFromInput() : this.roundDeliveryAmount(this.data.deliveryAmount);
		var strForeign = this.formatForeign(foreign,(this.isFromYen) ? 2 : 0);
		
		if(context.errorDeposit || foreign==0)	strForeign="";
		if(context.errorRemit || yens==0)	strYens="";
		var isError=context.errorDeposit || context.errorRemit;
		
		//Details block is hidden if there is an error and when the calculator is launched
		$(".remit-details").toggle(! (isError || o.status==0));
		
		this.html.inputYenAmount.val(strYens);			
		this.html.inputDeliveryAmount.val(strForeign);

		
		var deposit=o.roundRemitAmountYen(o.data.depositAmount);
		var remitYen=o.roundRemitAmountYen(o.data.remitAmountYen);
		
		//1. Display formatted data
		
		//Amount to deposit
		o.html.displayDepositAmount.html(formatYen(deposit,true));
		o.html.displayDepositAmountRegular.html(formatYen(o.data.depositAmountRegular,true));
		o.html.displayDepositAmountSpecial.html(formatYen(o.data.depositAmountSpecial,true));
		
		
		o.html.displayAmountBilled.html(formatYen(remitYen+o.data.remitFee-o.data.feeDiscountYen,true));
		o.html.displayCredit.html(formatYen(o.data.credit,true));
		o.html.displayCurrentBalance.html(formatYen(o.options.userBalance,true));
		var balanceAfterRequest=o.options.userBalance - o.data.credit;
		o.html.displayNextBalance.html(formatYen(balanceAfterRequest,true));
		
		$("#tr-next-balance").toggle(balanceAfterRequest>0);
		$("#tr-deposit").toggle(o.data.depositAmount >= 0);
		
		
		o.html.displayRemitFee.html(formatYen(o.data.remitFee-o.data.feeDiscountYen,true));//o.data.feeDiscountYen is a negative value!
		
		//Amount to send (yens)
		o.html.displayRemitAmountYen.html(formatYen(remitYen,true));
		o.html.displayRemitAmountYenRegular.html(formatYen(o.data.remitAmountYenRegular,true));
		o.html.displayRemitAmountYenSpecial.html(formatYen(o.data.remitAmountYenSpecial,true));
		
		o.html.displayDeliveryAmount.html(o.formatForeign(foreign));
		o.html.displayDeliveryAmountRegular.html(o.formatForeign(o.data.deliveryAmountRegular));
		o.html.displayDeliveryAmountSpecial.html(o.formatForeign(o.data.deliveryAmountSpecial));
		o.html.displayFeeDiscountYen.html(formatYen(o.data.feeDiscountYen,true));
		
		o.html.displayDeliveryAmountRegular.html(o.formatForeign(o.data.deliveryAmountRegular));
		o.html.displayDeliveryAmountSpecial.html(o.formatForeign(o.data.deliveryAmountSpecial));
		
		
		
		//2 Update hidden fields
		o.html.dataDepositAmount.val(deposit) ;
		o.html.dataDeliveryAmount.val(foreign) ;
		o.html.dataRemitFee.val(o.data.remitFee) ;		
		o.html.dataRemitAmountYen.val(remitYen);
		o.html.dataCredit.val(o.data.credit);
		
		var currency=o.activeRate;
		if(currency) o.html.dataExchangeRateId.val(currency.id) ;
	};//updateInterface method
	
	this.toString=function(){
		return "Braste Remit Calculator - Multibroker version ";
	};
	
	this.log=function(){
		if(window.console && o.options.debugMode) console.log.apply(window.console,arguments);
	};
	
	this.updateInterface();
  
	
}; //End of the calculator class


/* 

#############

Other functions and plug-in

#############

*/ 

var dblByte = ["\uFF10","\uFF11","\uFF12","\uFF13","\uFF14","\uFF15","\uFF16","\uFF17","\uFF18","\uFF19"];
var sglByte = ["0","1","2","3","4","5","6","7","8","9"];

function toSglByte(inpVal)
{
	for ( i = 0; i < 10; i++ )
	{
		if ( inpVal.indexOf(dblByte[i]) > -1)
		{
			var regex = new RegExp(dblByte[i],"g");
			inpVal = inpVal.replace(regex,sglByte[i]);
		}
	}
	return inpVal;
}

function findDblByteNums(inpVal)
{
	var dblBytes = 0;
	for ( i = 0; i < 10; i++ )
	{
		if ( inpVal.indexOf(dblByte[i]) > -1)
		{
			dblBytes += 1;
		}
	}
	if ( dblBytes > 0 ) return true;
	else return false;
}



// Author: Diego Perini <dperini@nwbox.com>
// from http://javascript.nwbox.com/cursor_position/
function getSelectionStart(o) {
	if (o.createTextRange) {
		var r = document.selection.createRange().duplicate();
		r.moveEnd('character', o.value.length);
		if (r.text == '') return o.value.length;
		return o.value.lastIndexOf(r.text);
	} else return o.selectionStart;
}

function getCurrenciesFromXML(xml){
	//From a given XML response, returns an object than contains currency details.
	
	var countries=[];
	var countryNodes=xml.find("Data > CountryList > Country");
	countryNodes.each(function(index,element){
		var node=$(element);
		countries.push(node.find("CountryCode").text());
	});
	
	var specialExchangeRateDiscount=stringToFloat(xml.find("SpecialExchangeRateDiscount").text());
	var flagSpecialRate=xml.find("InternalPriorityType").text();
	
	var dateTime0=xml.find("LatestUpdateDateTime").text();
	var dateTime=dateTime0.replace(/(\d{4}.\d{1,2}.\d{1,2} \d{1,2}.\d{2}).\d{2}/,"$1");//remove seconds
	
	var currencies=[];
	var values=xml.find("ExchangeValues:has(BestRate:contains(1))");
	values.each(function(index,element){
		var node=	$(element);			 
		var currencyCode=node.find("OriginCurrencyCode").text();
		var countryCode=node.find("CountryCode").text();
		var countryName=node.find("CountryName").text();
		var bestRate=getRateFromXMLNode(node);
		var rateNodes=xml.find("ExchangeValues:has(CountryCode:contains("+countryCode+"))");
		var rates=[];
		rateNodes.each(function(index,element){
			var node=	$(element);								
			var rateObject=getRateFromXMLNode(node);
			rates[rateObject.brokerCode+rateObject.agentCode]=rateObject;
		});
		if(jQuery.inArray(countryCode,countries)>-1){
			currencies.push({
				countryCode: countryCode,
				countryName: countryName,
				countryTranslation: getCountryTranslation(xml,countryCode),
				currencyCode: currencyCode,
				currencyTranslation: getCurrencyTranslation(xml,currencyCode),
				rates:rates,
				bestRate: bestRate
			});
		}//if
	});//each
	return {
		currencies: currencies,
		specialExchangeRateDiscount: specialExchangeRateDiscount,
		isSpecialRateApplied: (flagSpecialRate=="BRS"),
		dateTime: dateTime	
	};

}

function getRateFromXMLNode(xml){
	//	Return a "rate object" from a XML node.
	var node=xml.find("ExchangeValues");
	var brokerCode=node.find("BrokerCode").text();
	var agentCode=node.find("BrokerAgentCode").text();

	var id=node.find("ExchangeRateHistoryID").text();
	var discount=node.find("InternalPreferentialValue").text();
	var rateDollars=node.find("UpsetBrokerExchangeRate").text();
	var currenciesPerDollar=stringToFloat(node.find("BrokerExchangeRate").text());//1 USD = <BrokerExchangeRate> 

	var x=stringToFloat(node.find("BankExchangeRate").text());
	var deltaX=stringToFloat(node.find("InternalFluctuationValue").text());
	var rate=(x + deltaX) / currenciesPerDollar;
	
	var currencyCode=node.find("OriginCurrencyCode").text();
	
	return {
		exchangeRate: rate,//X yens for 1 foreign currency
		exchangeRateDiscount: stringToFloat(discount),						
		id: id,
		currenciesPerDollar: currenciesPerDollar,
		yensPerDollar: roundNbDecimal(x + deltaX,2),//used to display "Brastel's rate" in the main home page
		brokerCode: brokerCode,
		agentCode:agentCode,
		currencyCode: currencyCode,
		currencyTranslation: getCurrencyTranslation(xml,currencyCode)
	};
}

function getCountryTranslation(xml,countryCode){
//Searchs for e-text value for a given country code and returns the translation (from the eText[] global array)
	var eTextId=xml.find("CountryList Country:has(CountryCode:contains("+countryCode+")) e-text").text();
	var translation=translate('I'+eTextId, countryCode);
	return translation;
}

function getCurrencyTranslation(xml,currencyCode){
//Return the translation from a given currency code.
	var eTextId=xml.find("Category:has(Name:contains(currency)) CategoryItemList:has(value:contains("+currencyCode+")) text").text();
	var translation=translate(eTextId, currencyCode);
	return translation;
}

function getFeesDataFromXML(xml){
//Returns an objects with:
//-  fees_XX : an array of points used by calculator object to get Remittance Fee for country code XX
//-  fees_ALL : an array of points used by calculator object to get Remittance Fee for any countries with no specific rates set
	var feesDataFromXML = {};
	var values=xml.find("RemitFee:has(DepositType:contains(BNK))");
	values.each(function(index,element){
		var strX=$(element).find("LowerLimitRemit").text();
		var strY=$(element).find("Fee").text();
		var strZ=$(element).find("UpperLimitRemit").text();
		var strCountryCode=$(element).find("CountryCode").text();
		
		var x=stringToInteger(strX);
		var z=stringToInteger(strZ);
		if(x>0) x=x-1;
		var y=stringToInteger(strY);

		if(!feesDataFromXML['fees_' + strCountryCode])
			feesDataFromXML['fees_' + strCountryCode] = [];

		feesDataFromXML['fees_' + strCountryCode].push({x: x, y: y, z: z});
	});//each
	
	//var strMax=$(values[values.length-1]).find("UpperLimitRemit").text();
	//var maxAmount=stringToInteger(strMax);
	return feesDataFromXML;
	//return {
	//	fees: fees,
	//	maxAmountToRemit: maxAmount
	//};
	
}

function getUserDataFromXML(xml){
//Returns an object containing user parameters, needed by the calculator
		var strBalance=xml.find("TotalBalance").text();
		var strFeeDiscount=xml.find("FeeDiscountPercentage").text();
		var strPendingRequest=xml.find("RemitPendingRequest").text();
		var strMaxRequest=xml.find("RemitMaxNumberReachedBank").text();

		return {
			balance: stringToInteger(strBalance),
			feeDiscount: stringToInteger(strFeeDiscount),
			nbPendingRequest: stringToInteger(strPendingRequest),
			maxReached: strMaxRequest=="True"
		};
}

function roundExchangeRate(x){
		//	Round an exhange rate using 4 "significant digits"
		var nbDecimal=2;
		if(x<10) nbDecimal=3;
		if(x<1) nbDecimal=4;
		if(x<0.1) nbDecimal=5;
		if(x<0.01) nbDecimal=6;
		var y=Math.pow(10,nbDecimal);
		var z=Math.round(x*y)/y;
		return z;
}

function loadCalculatorData(loadUserData){
//Launches 2 Ajax request to get currencies and fees data
//Once both have been successfull, we can build the calculator.

	var currenciesData={};
	var feesData=[];
	var userData={};
	var nbSuccess=0;
	var nbMethod=(loadUserData) ? 2 : 1;
	
	var options={
		type: 'GET'
	};
	
	var accountID=$('#accountID').val();
	var isCRM=accountID && accountID!="";
	var data=(isCRM) ? "accountID="+accountID : null;
	var webMethod="";

	
	//Request #1 : fees
	options.callbackSuccess=function(xml){
		feesData=getFeesDataFromXML(xml);
		nbSuccess++;
		if(nbSuccess==nbMethod) allDone();
	};
	new IMTAjaxXMLRequest("GetRemittanceRules", null, options);
	
	//Request #2 : user data
	if(loadUserData){
		options.callbackSuccess=function(xml){
			userData=getUserDataFromXML(xml);
			nbSuccess++;
			if(nbSuccess==nbMethod) allDone();
		};
		webMethod=(isCRM) ? "GetUserRemittanceConditionsForAccount" : "GetUserRemittanceConditions";
		new IMTAjaxXMLRequest(webMethod, data, options);
	}
	
	/*sub-function called after all 3 callbacks have been called.*/
	function allDone(){
		initCalculator(currenciesData,feesData,userData);
	}
	
}

function parsePageDataFees(dataFees){
    //Return a map (or associative array) about fees by country, from a JSON object created in the markup.
    //This map can be used to initialize the "fees" property of the calculator object (see default Calculator options)
    var fees = [];
    for(var i=0;i<dataFees.fees.length;i++){
        var object = dataFees.fees[i];
        var countryCode = object.countryCode;        
        var values={
            maxAmount: stringToInteger(object.upperLimit),
            fee: stringToInteger(object.fee)
        };
        if(!fees[countryCode]) fees[countryCode]=[];
        fees[countryCode].push(values);
    }
    return fees;
}



/**
 * jQuery.timers - Timer abstractions for jQuery
 * Written by Blair Mitchelmore (blair DOT mitchelmore AT gmail DOT com)
 * Licensed under the WTFPL (http://sam.zoy.org/wtfpl/).
 * Date: 2009/10/16
 *
 * @author Blair Mitchelmore
 * @version 1.2
 *
 **/
jQuery.fn.extend({
	everyTime: function(interval, label, fn, times) {
		return this.each(function() {
			jQuery.timer.add(this, interval, label, fn, times);
		});
	},
	oneTime: function(interval, label, fn) {
		return this.each(function() {
			jQuery.timer.add(this, interval, label, fn, 1);
		});
	},
	stopTime: function(label, fn) {
		return this.each(function() {
			jQuery.timer.remove(this, label, fn);
		});
	}
});
jQuery.extend({
	timer: {
		global: [],
		guid: 1,
		dataKey: "jQuery.timer",
		regex: /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/,
		powers: {
			// Yeah this is major overkill...
			'ms': 1,
			'cs': 10,
			'ds': 100,
			's': 1000,
			'das': 10000,
			'hs': 100000,
			'ks': 1000000
		},
		timeParse: function(value) {
			if (value == undefined || value == null)
				return null;
			var result = this.regex.exec(jQuery.trim(value.toString()));
			if (result[2]) {
				var num = parseFloat(result[1]);
				var mult = this.powers[result[2]] || 1;
				return num * mult;
			} else {
				return value;
			}
		},
		add: function(element, interval, label, fn, times) {
			var counter = 0;
			
			if (jQuery.isFunction(label)) {
				if (!times) 
					times = fn;
				fn = label;
				label = interval;
			}
			
			interval = jQuery.timer.timeParse(interval);

			if (typeof interval != 'number' || isNaN(interval) || interval < 0)
				return;

			if (typeof times != 'number' || isNaN(times) || times < 0) 
				times = 0;
			
			times = times || 0;
			
			var timers = jQuery.data(element, this.dataKey) || jQuery.data(element, this.dataKey, {});
			
			if (!timers[label])
				timers[label] = {};
			
			fn.timerID = fn.timerID || this.guid++;
			
			var handler = function() {
				if ((++counter > times && times !== 0) || fn.call(element, counter) === false)
					jQuery.timer.remove(element, label, fn);
			};
			
			handler.timerID = fn.timerID;
			
			if (!timers[label][fn.timerID])
				timers[label][fn.timerID] = window.setInterval(handler,interval);
			
			this.global.push( element );
			
		},
		remove: function(element, label, fn) {
			var timers = jQuery.data(element, this.dataKey), ret;
			
			if ( timers ) {
				
				if (!label) {
					for ( label in timers )
						this.remove(element, label, fn);
				} else if ( timers[label] ) {
					if ( fn ) {
						if ( fn.timerID ) {
							window.clearInterval(timers[label][fn.timerID]);
							delete timers[label][fn.timerID];
						}
					} else {
						for ( var fn in timers[label] ) {
							window.clearInterval(timers[label][fn]);
							delete timers[label][fn];
						}
					}
					
					for ( ret in timers[label] ) break;
					if ( !ret ) {
						ret = null;
						delete timers[label];
					}
				}
				
				for ( ret in timers ) break;
				if ( !ret ) 
					jQuery.removeData(element, this.dataKey);
			}
		}
	}
});
jQuery(window).bind("unload", function() {
	jQuery.each(jQuery.timer.global, function(index, item) {
		jQuery.timer.remove(item);
	});
});
/* End of jQuery.timer plugin */