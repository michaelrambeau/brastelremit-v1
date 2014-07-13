/*
Exchange rates page 2013-06-10 Michael
*/

var calculator=null;

$(document).ready(function(){
	var ratesContainer=$(".rates-container").hide();
	var currency=$(".currency").css("visibility","hidden");
	var hidden=$(".hidden").hide();
	$(".country-container").hide();	
	loadCalculatorData();
	
	$("#selectCountry").change(function(){
		var countryCode=$(this).val();
		calculator.switchCurrency(countryCode);
		var bestRate=calculator.activeCurrency.bestRate;
		calculator.activeRate=bestRate;
		calculator.updateRate();
		currency.css("visibility","visible");
		ratesContainer.fadeIn("slow");
		hidden.show();
	})
});

function initCalculator(currenciesData,feesData,userData){
	//function called by remit_calculator.js, after data have been loaded by ajax requests
	var currencies=currenciesData.currencies;
	calculator=new RemitCalculator({
		currencies: currencies,
		specialExchangeRateDiscount: currenciesData.specialExchangeRateDiscount,
		feesFromYenDeposit: feesData.fees,
		maxAmountToRemit: feesData.maxAmountToRemit,
		anonymous:true
	});
	
	var combo=$("#selectCountry");
	jQuery.each(currencies,function(index,element){
		$('<option value="'+element.countryCode+'">'+element.countryTranslation+'</option>').appendTo(combo);
	});	
	
	$("#date-time").html(currenciesData.dateTime);
	$(".loading").hide();
	$(".country-container").fadeIn();
	
}