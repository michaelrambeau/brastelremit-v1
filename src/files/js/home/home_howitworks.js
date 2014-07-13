/*
JS code for "How it works" page
Calculator object is used to get fees values from the database.
Last version : Michael@Osaka 2012/05/10 delivery methods popup
*/
var calculator=null;

$(document).ready(function(){				   
	loadCalculatorData();
	$("a.nyroModal").click(function(){							
		new IMTDialog($("#delivery-methods-block"));//delivery methods popup						   								
		return false;
	});					   	
})

function initCalculator(currencies,feesData){
//Build calculator object from currencies and fees data
	calculator=new RemitCalculator({
		currencies: currencies,
		feesFromYenDeposit: feesData.fees,
		maxAmountToRemit: feesData.maxAmountToRemit
	});
	
	//Update HTML from calculated values
	//2 global variables are used : the amount to deposit in the 2 examples (30,000 yens) and (50,000 yens)
	var fee1=calculator.getFeeFromYenDeposit(amount1);
	var fee2=calculator.getFeeFromYenDeposit(amount2);
	
	var total1=amount1-fee1;
	var total2=amount2-fee2;
	
	$("#fee1").html(formatYen(fee1,true));
	$("#fee2").html(formatYen(fee2,true));
	
	$("#total1").html(formatYen(total1,true));
	$("#total2").html(formatYen(total2,true));
}